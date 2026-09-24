import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { AdminAuditLogService } from './admin-audit-log.service';

class SuspendUserDto {
  @IsString() @MaxLength(500) reason!: string;
}

class UpdateUserAdminDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() isVerified?: boolean;
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminUsersController {
  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AdminAuditLogService,
  ) {}

  @Get()
  async list(
    @Query('q') query?: string,
    @Query('status') status?: string,
    @Query('verification') verification?: string,
    @Query('page') rawPage?: string,
    @Query('limit') rawLimit?: string,
  ) {
    const page = Math.max(Number(rawPage) || 1, 1);
    const limit = Math.min(Math.max(Number(rawLimit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const searchTerm = query?.trim() ? `%${query.trim()}%` : null;
    const filterStatus = status?.trim() ? status.trim().toUpperCase() : null;
    const filterVerification = verification?.trim() ? verification.trim().toUpperCase() : null;

    const [items, count] = await Promise.all([
      this.db.query(
        `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.status::text AS status,
                CASE WHEN u.is_verified THEN 'VERIFIED' ELSE 'UNVERIFIED' END AS verification_status,
                u.created_at,
                (SELECT COUNT(*)::int FROM products p WHERE p.seller_id = u.id AND p.deleted_at IS NULL) AS posts_count,
                (SELECT COUNT(*)::int FROM orders o WHERE o.buyer_id = u.id) AS orders_count
         FROM users u
         WHERE ($1::text IS NULL OR u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1 OR u.id::text ILIKE $1)
           AND ($2::text IS NULL OR u.status::text = $2)
           AND ($3::text IS NULL OR (CASE WHEN u.is_verified THEN 'VERIFIED' ELSE 'UNVERIFIED' END) = $3)
         ORDER BY u.created_at DESC
         LIMIT $4 OFFSET $5`,
        [searchTerm, filterStatus, filterVerification, limit, offset],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS total
         FROM users u
         WHERE ($1::text IS NULL OR u.full_name ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1 OR u.id::text ILIKE $1)
           AND ($2::text IS NULL OR u.status::text = $2)
           AND ($3::text IS NULL OR (CASE WHEN u.is_verified THEN 'VERIFIED' ELSE 'UNVERIFIED' END) = $3)`,
        [searchTerm, filterStatus, filterVerification],
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

  @Get(':id')
  async detail(@Param('id') id: string) {
    const user = await this.db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.status::text AS status,
              CASE WHEN u.is_verified THEN 'VERIFIED' ELSE 'UNVERIFIED' END AS verification_status,
              u.created_at
       FROM users u WHERE u.id = $1`,
      [id],
    );
    if (!user.rows[0]) throw new BadRequestException('Không tìm thấy người dùng');
    return { success: true, data: user.rows[0], message: null, errorCode: null };
  }

  @Patch(':id')
  async update(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() body: UpdateUserAdminDto) {
    const result = await this.db.query(
      `UPDATE users
       SET full_name = COALESCE($2, full_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           status = COALESCE($5::user_status, status),
           is_verified = COALESCE($6, is_verified),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, full_name, email, phone, status::text AS status, is_verified`,
      [id, body.fullName?.trim() || null, body.email?.trim() || null, body.phone?.trim() || null, body.status || null, body.isVerified ?? null],
    );
    if (!result.rows[0]) throw new BadRequestException('Không tìm thấy người dùng');
    await this.audit.log(request.user.id, 'Super Admin', 'UPDATE_USER', 'User', id, { name: result.rows[0].full_name });
    return { success: true, data: result.rows[0], message: 'Đã cập nhật thông tin tài khoản thành công', errorCode: null };
  }

  @Delete(':id')
  async delete(@Req() request: { user: { id: string } }, @Param('id') id: string) {
    // Check if user has orders
    const ordersCount = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM orders WHERE buyer_id = $1 OR seller_id = $1`,
      [id],
    );
    const count = parseInt(ordersCount.rows[0]?.count || '0', 10);
    if (count > 0) {
      throw new BadRequestException(`Không thể xóa tài khoản này vì đã phát sinh ${count} giao dịch/đơn hàng trên hệ thống. Bạn có thể chọn Tạm khóa tài khoản.`);
    }

    // Hard delete all user data in a single database transaction
    const user = await this.db.transaction(async (client) => {
      const existing = await client.query('SELECT id, full_name, email FROM users WHERE id = $1', [id]);
      if (!existing.rows[0]) throw new BadRequestException('Không tìm thấy người dùng');

      // Delete user's products & images
      const userProducts = await client.query<{ id: string }>('SELECT id FROM products WHERE seller_id = $1', [id]);
      for (const p of userProducts.rows) {
        await client.query('DELETE FROM product_images WHERE product_id = $1', [p.id]);
      }
      await client.query('DELETE FROM products WHERE seller_id = $1', [id]);

      // Delete user's listings & listing media
      const userListings = await client.query<{ id: string }>('SELECT id FROM listings WHERE seller_id = $1', [id]);
      for (const l of userListings.rows) {
        await client.query('DELETE FROM listing_images WHERE listing_id = $1', [l.id]);
        await client.query('DELETE FROM listing_videos WHERE listing_id = $1', [l.id]);
        await client.query('DELETE FROM listing_field_values WHERE listing_id = $1', [l.id]);
      }
      await client.query('DELETE FROM listings WHERE seller_id = $1', [id]);

      // Delete user messages & chats
      await client.query('DELETE FROM messages WHERE sender_id = $1', [id]);
      await client.query('DELETE FROM chats WHERE buyer_id = $1 OR seller_id = $1', [id]);

      // Delete user devices, blocks, reports
      await client.query('DELETE FROM push_devices WHERE user_id = $1', [id]);
      await client.query('DELETE FROM user_blocks WHERE blocker_id = $1 OR blocked_id = $1', [id]);
      await client.query('DELETE FROM content_reports WHERE reporter_id = $1 OR reported_user_id = $1', [id]);

      // Delete user account
      await client.query('DELETE FROM users WHERE id = $1', [id]);

      return existing.rows[0];
    });

    await this.audit.log(request.user.id, 'Super Admin', 'DELETE_USER', 'User', id, { name: user.full_name });
    return { success: true, data: { id }, message: 'Đã xóa vĩnh viễn toàn bộ dữ liệu tài khoản khỏi hệ thống', errorCode: null };
  }

  @Post(':id/suspend')
  async suspend(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() body: SuspendUserDto) {
    const result = await this.db.query(
      `UPDATE users SET status='SUSPENDED', updated_at=NOW() WHERE id=$1 RETURNING id, full_name, status`,
      [id],
    );
    if (!result.rows[0]) throw new BadRequestException('Không tìm thấy người dùng');
    await this.audit.log(request.user.id, 'Super Admin', 'USER_SUSPENDED', 'User', id, { reason: body.reason, name: result.rows[0].full_name });
    return { success: true, data: result.rows[0], message: 'Đã tạm khóa tài khoản người dùng', errorCode: null };
  }

  @Post(':id/unsuspend')
  async unsuspend(@Req() request: { user: { id: string } }, @Param('id') id: string) {
    const result = await this.db.query(
      `UPDATE users SET status='ACTIVE', updated_at=NOW() WHERE id=$1 RETURNING id, full_name, status`,
      [id],
    );
    if (!result.rows[0]) throw new BadRequestException('Không tìm thấy người dùng');
    await this.audit.log(request.user.id, 'Super Admin', 'USER_UNSUSPENDED', 'User', id, { name: result.rows[0].full_name });
    return { success: true, data: result.rows[0], message: 'Đã mở khóa tài khoản người dùng', errorCode: null };
  }

  @Post(':id/verify')
  async verify(@Req() request: { user: { id: string } }, @Param('id') id: string) {
    const result = await this.db.query(
      `UPDATE users SET is_verified=true, updated_at=NOW() WHERE id=$1 RETURNING id, full_name, is_verified`,
      [id],
    );
    if (!result.rows[0]) throw new BadRequestException('Không tìm thấy người dùng');
    await this.audit.log(request.user.id, 'Super Admin', 'USER_VERIFIED', 'User', id, { name: result.rows[0].full_name });
    return { success: true, data: result.rows[0], message: 'Đã xác minh tài khoản thành công', errorCode: null };
  }
}
