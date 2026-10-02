import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { ModeratorGuard } from './moderator.guard';
import { AdminAuditLogService } from './admin-audit-log.service';
import { NotificationsService } from '../account/notifications.service';
import { ModerationPolicyService } from '../moderation/moderation-policy.service';
import { ensureDeletionColumns } from '../products/deletion-audit';

class RejectPostDto {
  @IsString() @MaxLength(500) reason!: string;
}

class HidePostDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

class DeletePostDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

class UpdatePostAdminDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() price?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() description?: string;
}

@Controller('admin/posts')
@UseGuards(JwtAuthGuard, ModeratorGuard)
export class AdminPostsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditLogService,
    private readonly notifications: NotificationsService,
    private readonly policy: ModerationPolicyService,
  ) {}

  private async notifySeller(productId: string, type: string, title: string, content: string) {
    try {
      const row = (await this.db.query('SELECT seller_id FROM products WHERE id=$1', [productId])).rows[0];
      if (row) await this.notifications.create(row.seller_id, type, title, content, 'PRODUCT', productId);
    } catch { /* thông báo là phụ, không làm hỏng thao tác quản trị */ }
  }

  @Get()
  async list(
    @Query('q') query?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
  ) {
    const page = Math.max(Number(rawPage) || 1, 1);
    const limit = Math.min(Math.max(Number(rawLimit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const searchTerm = query?.trim() ? `%${query.trim()}%` : null;
    const filterStatus = status?.trim() ? status.trim().toUpperCase() : null;
    const filterCategory = categoryId?.trim() ? categoryId.trim() : null;

    const [items, count] = await Promise.all([
      this.db.query(
        `SELECT p.id, p.title, p.price, p.status::text AS status,
                (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS image_url,
                p.description, p.created_at, p.updated_at,
                COALESCE(cat.name, 'Khác') AS category_name,
                COALESCE(u.full_name, 'Người dùng') AS seller_name, u.email AS seller_email, u.phone AS seller_phone
         FROM products p
         LEFT JOIN categories cat ON cat.id::text = p.category_id::text
         LEFT JOIN users u ON u.id = p.seller_id
         WHERE p.deleted_at IS NULL
           AND ($1::text IS NULL OR p.title ILIKE $1 OR p.id::text ILIKE $1 OR u.full_name ILIKE $1)
           AND ($2::text IS NULL OR p.status::text = $2)
           AND ($3::text IS NULL OR p.category_id::text = $3)
         ORDER BY p.created_at DESC
         LIMIT $4 OFFSET $5`,
        [searchTerm, filterStatus, filterCategory, limit, offset],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total
         FROM products p
         LEFT JOIN users u ON u.id = p.seller_id
         WHERE p.deleted_at IS NULL
           AND ($1::text IS NULL OR p.title ILIKE $1 OR p.id::text ILIKE $1 OR u.full_name ILIKE $1)
           AND ($2::text IS NULL OR p.status::text = $2)
           AND ($3::text IS NULL OR p.category_id::text = $3)`,
        [searchTerm, filterStatus, filterCategory],
      ),
    ]);

    return {
      success: true,
      data: items.rows,
      meta: {
        page,
        limit,
        total: count.rows[0]?.total || 0,
      },
      message: null,
      errorCode: null,
    };
  }

  @Post(':id/approve')
  async approve(@Req() request: { user: { id: string } }, @Param('id') id: string) {
    const result = await this.db.query(
      `UPDATE products
       SET status='ACTIVE', published_at=COALESCE(published_at,NOW()), updated_at=NOW()
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING id, title, status`,
      [id],
    );
    if (!result.rows[0]) throw new BadRequestException('Không tìm thấy tin đăng');
    void this.policy.logEvent(id, 'ADMIN', 'APPROVED', [], request.user.id);
    await this.audit.log(request.user.id, 'Super Admin', 'POST_APPROVED', 'Product', id, { title: result.rows[0].title });
    void this.notifySeller(id, 'LISTING_APPROVED', 'Tin đăng đã được duyệt', `Tin “${result.rows[0].title}” đã được duyệt và đang hiển thị.`);
    return { success: true, data: result.rows[0], message: 'Đã duyệt tin đăng thành công', errorCode: null };
  }

  @Post(':id/unhide')
  async unhide(@Req() request: { user: { id: string } }, @Param('id') id: string) {
    const result = await this.db.query(
      `UPDATE products
       SET status='ACTIVE', updated_at=NOW()
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING id, title, status`,
      [id],
    );
    if (!result.rows[0]) throw new BadRequestException('Không tìm thấy tin đăng');
    await this.audit.log(request.user.id, 'Super Admin', 'POST_UNHIDDEN', 'Product', id, { title: result.rows[0].title });
    void this.notifySeller(id, 'LISTING_UNHIDDEN', 'Tin đăng được hiển thị lại', `Tin “${result.rows[0].title}” đã được hiển thị lại.`);
    return { success: true, data: result.rows[0], message: 'Đã hiển thị lại tin đăng thành công', errorCode: null };
  }

  @Patch(':id')
  @UseGuards(FinanceAdminGuard) // chỉ Admin được sửa nội dung tin
  async update(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() body: UpdatePostAdminDto) {
    const result = await this.db.query(
      `UPDATE products
       SET title = COALESCE($2, title),
           price = COALESCE($3, price),
           status = COALESCE($4::product_status, status),
           description = COALESCE($5, description),
           updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, title, price, status`,
      [id, body.title?.trim() || null, body.price || null, body.status === 'PENDING' ? 'PENDING_REVIEW' : body.status || null, body.description?.trim() || null],
    );
    if (!result.rows[0]) throw new BadRequestException('Không tìm thấy tin đăng');
    await this.audit.log(request.user.id, 'Super Admin', 'POST_EDITED', 'Product', id, { title: result.rows[0].title });
    return { success: true, data: result.rows[0], message: 'Đã cập nhật thông tin tin đăng', errorCode: null };
  }

  @Delete(':id')
  @UseGuards(FinanceAdminGuard) // chỉ Admin được xóa tin
  async delete(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() body?: DeletePostDto) {
    const reason = body?.reason?.trim().slice(0, 500) || 'Quản trị viên xóa tin đăng';
    await ensureDeletionColumns(this.db);
    const result = await this.db.query(
      `UPDATE products SET deleted_at=NOW(), deleted_by=$2::uuid, deleted_by_role='ADMIN', deleted_reason=$3, updated_at=NOW()
       WHERE id=$1 AND deleted_at IS NULL RETURNING id, title, seller_id`,
      [id, request.user.id, reason],
    );
    if (!result.rows[0]) throw new BadRequestException('Không tìm thấy tin đăng');
    await this.audit.log(request.user.id, 'Super Admin', 'POST_DELETED', 'Product', id, { title: result.rows[0].title, reason });
    void this.notifySeller(id, 'LISTING_HIDDEN', 'Tin đăng của bạn đã bị xóa', `Tin “${result.rows[0].title}” đã bị quản trị viên xóa. Lý do: ${reason}`);
    return { success: true, data: { id }, message: 'Đã xóa tin đăng thành công', errorCode: null };
  }

  @Post(':id/reject')
  async reject(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() body: RejectPostDto) {
    const result = await this.db.query(
      `UPDATE products
       SET status='REJECTED', updated_at=NOW()
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING id, title, status`,
      [id],
    );
    if (!result.rows[0]) throw new BadRequestException('Không tìm thấy tin đăng');
    void this.policy.logEvent(id, 'ADMIN', 'REJECTED', [body.reason], request.user.id);
    await this.audit.log(request.user.id, 'Super Admin', 'POST_REJECTED', 'Product', id, { title: result.rows[0].title, reason: body.reason });
    void this.notifySeller(id, 'LISTING_REJECTED', 'Tin đăng bị từ chối', `Tin “${result.rows[0].title}” bị từ chối. Lý do: ${body.reason}`);
    return { success: true, data: result.rows[0], message: 'Đã từ chối tin đăng', errorCode: null };
  }

  @Post(':id/hide')
  async hide(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() body: HidePostDto) {
    const result = await this.db.query(
      `UPDATE products
       SET status='HIDDEN', updated_at=NOW()
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING id, title, status`,
      [id],
    );
    if (!result.rows[0]) throw new BadRequestException('Không tìm thấy tin đăng');
    await this.audit.log(request.user.id, 'Super Admin', 'POST_HIDDEN', 'Product', id, { title: result.rows[0].title, reason: body.reason });
    void this.notifySeller(id, 'LISTING_HIDDEN', 'Tin đăng bị ẩn', `Tin “${result.rows[0].title}” đã bị ẩn${body.reason ? '. Lý do: ' + body.reason : ''}.`);
    return { success: true, data: result.rows[0], message: 'Đã ẩn tin đăng', errorCode: null };
  }
}
