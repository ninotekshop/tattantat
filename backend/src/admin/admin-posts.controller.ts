import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { AdminAuditLogService } from './admin-audit-log.service';

class RejectPostDto {
  @IsString() @MaxLength(500) reason!: string;
}

class HidePostDto {
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

@Controller('admin/posts')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminPostsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditLogService,
  ) {}

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
    const filterStatus = status?.toUpperCase() || null;
    const filterCategory = categoryId || null;

    const [items, count] = await Promise.all([
      this.db.query(
        `SELECT p.id, p.title, p.price, p.status, p.image_url, p.description, p.created_at, p.updated_at,
                COALESCE(cat.name, 'Khác') AS category_name,
                COALESCE(u.full_name, 'Người dùng') AS seller_name, u.email AS seller_email, u.phone AS seller_phone
         FROM products p
         LEFT JOIN listing_categories cat ON cat.id::text = p.category_id::text
         LEFT JOIN users u ON u.id = p.user_id
         WHERE p.deleted_at IS NULL
           AND ($1::text IS NULL OR p.title ILIKE $1 OR p.id::text ILIKE $1 OR u.full_name ILIKE $1)
           AND ($2::text IS NULL OR p.status = $2)
           AND ($3::text IS NULL OR p.category_id::text = $3)
         ORDER BY p.created_at DESC
         LIMIT $4 OFFSET $5`,
        [searchTerm, filterStatus, filterCategory, limit, offset],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total
         FROM products p
         LEFT JOIN users u ON u.id = p.user_id
         WHERE p.deleted_at IS NULL
           AND ($1::text IS NULL OR p.title ILIKE $1 OR p.id::text ILIKE $1 OR u.full_name ILIKE $1)
           AND ($2::text IS NULL OR p.status = $2)
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
       SET status='ACTIVE', updated_at=NOW()
       WHERE id=$1 AND deleted_at IS NULL
       RETURNING id, title, status`,
      [id],
    );
    if (!result.rows[0]) throw new BadRequestException('Không tìm thấy tin đăng');
    await this.audit.log(request.user.id, 'Super Admin', 'POST_APPROVED', 'Product', id, { title: result.rows[0].title });
    return { success: true, data: result.rows[0], message: 'Đã duyệt tin đăng thành công', errorCode: null };
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
    await this.audit.log(request.user.id, 'Super Admin', 'POST_REJECTED', 'Product', id, { title: result.rows[0].title, reason: body.reason });
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
    return { success: true, data: result.rows[0], message: 'Đã ẩn tin đăng', errorCode: null };
  }
}
