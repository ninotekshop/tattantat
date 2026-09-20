import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type FavoriteProductRow = {
  id: string;
  title: string;
  price: string;
  address: string | null;
  created_at: string;
  seller_name: string;
  image_url: string | null;
  description: string | null;
  condition: string | null;
  category_id: number | null;
  status: string;
  seller_id: string;
  listing_price_mode: string;
  listing_id: string | null;
};

@Injectable()
export class FavoritesService {
  constructor(private readonly db: DatabaseService) {}

  async list(userId: string) {
    const result = await this.db.query<FavoriteProductRow>(
      `SELECT p.id,p.title,p.price::text,p.address,p.created_at,p.description,p.condition,p.category_id,p.status::text,p.seller_id,p.listing_price_mode,(SELECT l.id FROM listings l WHERE l.product_id=p.id) AS listing_id,
              u.full_name AS seller_name,
              (SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order LIMIT 1) AS image_url
       FROM favorites f JOIN products p ON p.id=f.product_id JOIN users u ON u.id=p.seller_id
       WHERE f.user_id=$1 AND p.status='ACTIVE' AND p.deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=p.seller_id) OR (b.blocked_id=$1 AND b.blocker_id=p.seller_id))
       ORDER BY f.created_at DESC`,
      [userId],
    );
    return { success: true, data: result.rows.map((row) => this.payload(row)), message: null, errorCode: null };
  }

  async add(userId: string, productId: string) {
    // A favorite must refer to a currently purchasable listing; this avoids
    // retaining an invalid foreign reference when listings are removed.
    const inserted = await this.db.query(
      `INSERT INTO favorites(user_id,product_id)
       SELECT $1,id FROM products p WHERE id=$2 AND status='ACTIVE' AND deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=p.seller_id) OR (b.blocked_id=$1 AND b.blocker_id=p.seller_id))
       ON CONFLICT DO NOTHING RETURNING product_id`,
      [userId, productId],
    );
    if (!inserted.rows[0]) {
      const exists = await this.db.query('SELECT 1 FROM favorites WHERE user_id=$1 AND product_id=$2', [userId, productId]);
      if (!exists.rows[0]) throw new NotFoundException('Sản phẩm không còn được bán');
    }
    return { success: true, data: { productId }, message: null, errorCode: null };
  }

  async remove(userId: string, productId: string) {
    await this.db.query('DELETE FROM favorites WHERE user_id=$1 AND product_id=$2', [userId, productId]);
    return { success: true, data: null, message: null, errorCode: null };
  }

  private payload(row: FavoriteProductRow) {
    return {
      id: row.id, title: row.title, price: row.price, location: row.address ?? 'Chưa cập nhật',
      sellerId: row.seller_id, priceMode: row.listing_price_mode ?? 'FIXED', listingId: row.listing_id,
      postedAt: row.created_at, sellerName: row.seller_name, imageUrl: row.image_url ?? '',
      description: row.description, condition: row.condition, categoryId: row.category_id, status: row.status,
    };
  }
}
