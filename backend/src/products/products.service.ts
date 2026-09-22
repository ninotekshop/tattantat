import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductDto, UpdateProductDto } from './dto/products.dto';
import { ModerationService } from '../admin/moderation.service';
import { randomUUID } from 'crypto';

type ProductRow = { id: string; title: string; price: string; address: string | null; created_at: string; seller_id?: string; seller_name: string; image_url: string | null; description?: string | null; condition?: string; category_id?: number; status?: string; listing_price_mode?:string; listing_id?:string|null };

@Injectable()
export class ProductsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly moderation: ModerationService,
  ) {}

  async categories() { return this.envelope((await this.database.query('SELECT id, name, slug, icon_url FROM categories WHERE status = $1 ORDER BY sort_order, name', ['ACTIVE'])).rows); }

  async list(query?: string, categoryId?: number, viewerId?: string) {
    if (categoryId !== undefined && (!Number.isSafeInteger(categoryId) || categoryId < 1)) {
      throw new BadRequestException('Danh mục không hợp lệ');
    }
    const result = await this.database.query<ProductRow>(
      `SELECT p.id, p.title, p.price::text, p.address, p.created_at, p.status::text, p.seller_id, p.listing_price_mode, u.full_name AS seller_name,
       (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image_url
       FROM products p JOIN users u ON u.id = p.seller_id
       WHERE p.status = 'ACTIVE' AND p.deleted_at IS NULL AND ($1 = '' OR p.title ILIKE '%' || $1 || '%')
         AND ($2::bigint IS NULL OR p.category_id IN (WITH RECURSIVE tree AS (SELECT id FROM categories WHERE id=$2::bigint UNION SELECT c.id FROM categories c JOIN tree t ON c.parent_id=t.id) SELECT id FROM tree))
         AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE $3::uuid IS NOT NULL AND ((b.blocker_id=$3::uuid AND b.blocked_id=p.seller_id) OR (b.blocker_id=p.seller_id AND b.blocked_id=$3::uuid)))
       ORDER BY p.published_at DESC LIMIT 50`, [query?.trim() ?? '', categoryId ?? null, viewerId ?? null],
    );
    return this.envelope(result.rows.map((row) => this.productPayload(row)));
  }

  async detail(id: string, viewerId?: string) {
    const result = await this.database.query<ProductRow>(
      `SELECT p.id, p.title, p.price::text, p.address, p.created_at, p.status::text, p.seller_id, p.description, p.condition, p.category_id, p.listing_price_mode, (SELECT l.id FROM listings l WHERE l.product_id=p.id) AS listing_id, u.full_name AS seller_name,
       (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image_url FROM products p JOIN users u ON u.id = p.seller_id
       WHERE p.id = $1 AND p.status = 'ACTIVE' AND p.deleted_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE $2::uuid IS NOT NULL AND ((b.blocker_id=$2::uuid AND b.blocked_id=p.seller_id) OR (b.blocker_id=p.seller_id AND b.blocked_id=$2::uuid)))`, [id, viewerId ?? null],
    );
    if (!result.rows[0]) throw new NotFoundException('Không tìm thấy sản phẩm');
    return this.envelope(this.productPayload(result.rows[0]));
  }

  async mine(userId: string) {
    const result = await this.database.query<ProductRow>(`SELECT p.id,p.title,p.price::text,p.address,p.created_at,p.status::text,p.seller_id,p.listing_price_mode,(SELECT l.id FROM listings l WHERE l.product_id=p.id) AS listing_id,u.full_name AS seller_name,(SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order LIMIT 1) AS image_url FROM products p JOIN users u ON u.id=p.seller_id WHERE p.seller_id=$1 AND p.deleted_at IS NULL ORDER BY p.created_at DESC`, [userId]);
    return this.envelope(result.rows.map((row) => this.productPayload(row)));
  }

  async create(sellerId: string, body: CreateProductDto) {
    for (const key of body.imageKeys) if (!/^[a-zA-Z0-9_./-]+$/.test(key)) throw new BadRequestException('Đường dẫn ảnh không hợp lệ');

    // Closed Marketplace Moderation Check
    const modResult = this.moderation.evaluate(body.title, body.description || '', body.price);
    if (modResult.action === 'NEEDS_CHANGES') {
      throw new BadRequestException({
        success: false,
        errorCode: 'CONTACT_INFO_DETECTED',
        message: modResult.reasons[0]?.message || 'Tin đăng chứa thông tin liên hệ ngoài Tất Tần Tật. Vui lòng xóa SĐT/Zalo/email/link ngoài để tiếp tục.',
      });
    } else if (modResult.action === 'REJECT') {
      throw new BadRequestException({
        success: false,
        errorCode: 'PROHIBITED_CONTENT',
        message: modResult.reasons[0]?.message || 'Nội dung tin đăng vi phạm tiêu chuẩn cộng đồng.',
      });
    }

    const initialStatus = modResult.action === 'AUTO_APPROVE' ? 'ACTIVE' : 'PENDING';

    const id = await this.database.transaction(async (client) => {
      const seller = await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [sellerId]);
      if (!seller.rows[0]) throw new BadRequestException('Người bán không hợp lệ');
      const plan = await client.query<{ max_listings: number | null }>(
        `SELECT s.max_listings_snapshot AS max_listings FROM subscriptions s
         WHERE s.seller_id=$1 AND s.status='ACTIVE' AND (s.ends_at IS NULL OR s.ends_at>NOW())
         ORDER BY s.created_at DESC LIMIT 1`, [sellerId],
      );
      const maxListings = plan.rows[0]?.max_listings ?? 10;
      if (maxListings !== null) {
        const current = await client.query<{ count: string }>(`SELECT count(*)::text AS count FROM products WHERE seller_id=$1 AND status IN ('DRAFT','PENDING_REVIEW','ACTIVE','RESERVED')`, [sellerId]);
        if (Number(current.rows[0].count) >= maxListings) throw new BadRequestException('Bạn đã đạt giới hạn tin đăng của gói hiện tại');
      }
      const category = await client.query('SELECT id FROM categories WHERE id = $1 AND status = $2', [body.categoryId, 'ACTIVE']);
      if (!category.rows[0]) throw new BadRequestException('Danh mục không hợp lệ');
      const slug = `${this.slugify(body.title)}-${randomUUID().slice(0, 8)}`;
      const created = await client.query<{ id: string }>(
        `INSERT INTO products (seller_id, category_id, title, slug, description, price, condition, status, published_at) VALUES ($1,$2,$3,$4,$5,$6,$7::product_condition,$8::product_status,NOW()) RETURNING id`,
        [sellerId, body.categoryId, body.title.trim(), slug, body.description?.trim() ?? null, body.price, body.condition, initialStatus],
      );
      for (const [index, key] of body.imageKeys.entries()) {
        const url = `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${key}`;
        await client.query('INSERT INTO product_images (product_id, url, sort_order) VALUES ($1,$2,$3)', [created.rows[0].id, url, index]);
      }
      return created.rows[0].id;
    });
    return this.envelope({ id, status: initialStatus });
  }

  async setVisibility(sellerId: string, productId: string, status: 'ACTIVE' | 'HIDDEN') {
    const updated = await this.database.query<ProductRow>(
      `UPDATE products SET status=$3::product_status, updated_at=NOW()
       WHERE id=$1 AND seller_id=$2 AND deleted_at IS NULL AND status IN ('ACTIVE','HIDDEN')
       RETURNING id,title,price::text,address,created_at,status::text`,
      [productId, sellerId, status],
    );
    if (!updated.rows[0]) throw new NotFoundException('Tin đăng không tồn tại hoặc không thể thay đổi trạng thái');
    return this.envelope({ id: updated.rows[0].id, status: updated.rows[0].status });
  }

  async update(sellerId: string, productId: string, body: UpdateProductDto) {
    for (const key of body.imageKeys ?? []) if (!/^[a-zA-Z0-9_./-]+$/.test(key)) throw new BadRequestException('Đường dẫn ảnh không hợp lệ');

    if (body.title || body.description) {
      const modResult = this.moderation.evaluate(body.title || '', body.description || '', body.price);
      if (modResult.action === 'NEEDS_CHANGES') {
        throw new BadRequestException({
          success: false,
          errorCode: 'CONTACT_INFO_DETECTED',
          message: modResult.reasons[0]?.message || 'Tin đăng chứa thông tin liên hệ ngoài Tất Tần Tật. Vui lòng xóa SĐT/Zalo/email/link ngoài để tiếp tục.',
        });
      }
    }

    const result = await this.database.transaction(async (client) => {
      if (body.categoryId) {
        const category = await client.query('SELECT id FROM categories WHERE id=$1 AND status=$2', [body.categoryId, 'ACTIVE']);
        if (!category.rows[0]) throw new BadRequestException('Danh mục không hợp lệ');
      }
      const updated = await client.query<ProductRow>(
        `UPDATE products SET title=COALESCE($3,title),price=COALESCE($4,price),description=COALESCE($5,description),
         condition=COALESCE($6::product_condition,condition),category_id=COALESCE($7,category_id),updated_at=NOW()
         WHERE id=$1 AND seller_id=$2 AND status IN ('ACTIVE','HIDDEN') AND deleted_at IS NULL
           AND NOT EXISTS (SELECT 1 FROM listings l WHERE l.product_id=products.id)
         RETURNING id,title,price::text,address,created_at,status::text`,
        [productId,sellerId,body.title?.trim() ?? null,body.price ?? null,body.description?.trim() ?? null,body.condition ?? null,body.categoryId ?? null],
      );
      if (!updated.rows[0]) throw new NotFoundException('Tin đăng không thể chỉnh sửa');
      if (body.imageKeys) {
        await client.query('DELETE FROM product_images WHERE product_id=$1', [productId]);
        for (const [sortOrder,key] of body.imageKeys.entries()) await client.query('INSERT INTO product_images(product_id,url,sort_order) VALUES($1,$2,$3)', [productId, `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${key}`, sortOrder]);
      }
      return updated.rows[0];
    });
    return this.envelope(this.productPayload(result));
  }

  private productPayload(row: ProductRow) { return { id: row.id, title: row.title, price: row.price, priceMode:row.listing_price_mode??'FIXED', listingId:row.listing_id??null, location: row.address ?? 'Chưa cập nhật', postedAt: row.created_at, sellerId: row.seller_id ?? '', sellerName: row.seller_name, imageUrl: row.image_url ?? '', description: row.description ?? null, condition: row.condition ?? null, categoryId: row.category_id ?? null, status: row.status ?? 'ACTIVE' }; }
  private envelope<T>(data: T) { return { success: true, data, message: null, errorCode: null }; }
  private slugify(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
}
