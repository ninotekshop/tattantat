import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { AdminAuditLogService } from './admin-audit-log.service';
import { clearModeratorCache } from './moderator.guard';
import { NotificationsService } from '../account/notifications.service';

class SetRoleDto {
  @IsIn(['MOD', 'USER']) role!: 'MOD' | 'USER';
}

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
    private readonly notifications: NotificationsService,
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
        `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.status::text AS status, u.role::text AS role,
                CASE WHEN u.is_verified THEN 'VERIFIED' ELSE 'UNVERIFIED' END AS verification_status,
                u.created_at,
                (SELECT COUNT(*)::int FROM products p WHERE p.seller_id = u.id AND p.deleted_at IS NULL) AS posts_count,
                (SELECT COUNT(*)::int FROM orders o WHERE o.buyer_id = u.id) AS orders_count,
                (SELECT t.score FROM user_trust_scores t WHERE t.user_id = u.id) AS trust_score,
                (SELECT t.stars FROM user_trust_scores t WHERE t.user_id = u.id) AS trust_stars
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
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.status::text AS status, u.role::text AS role,
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

  /** Cấp / thu hồi quyền Điều hành viên (MOD). Chỉ chuyển qua lại giữa USER và MOD, không đụng tới tài khoản Admin. */
  @Post(':id/role')
  async setRole(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() body: SetRoleDto) {
    if (request.user.id === id) throw new BadRequestException('Không thể tự đổi vai trò của chính mình.');
    const target = await this.db.query<{ id: string; full_name: string; role: string; status: string }>(
      `SELECT id, full_name, role::text AS role, status::text AS status FROM users WHERE id=$1 AND deleted_at IS NULL`, [id]);
    const u = target.rows[0];
    if (!u) throw new BadRequestException('Không tìm thấy người dùng');
    if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') throw new BadRequestException('Không thể đổi vai trò của tài khoản Quản trị viên.');
    if (body.role === 'MOD' && u.status !== 'ACTIVE') throw new BadRequestException('Chỉ cấp quyền MOD cho tài khoản đang hoạt động.');
    if (u.role === body.role) return { success: true, data: { id, role: u.role }, message: 'Vai trò không thay đổi', errorCode: null };
    const result = await this.db.query(`UPDATE users SET role=$2::user_role, updated_at=NOW() WHERE id=$1 RETURNING id, full_name, role::text AS role`, [id, body.role]);
    clearModeratorCache(id);
    await this.audit.log(request.user.id, 'Super Admin', body.role === 'MOD' ? 'USER_MOD_GRANTED' : 'USER_MOD_REVOKED', 'User', id, { name: u.full_name });
    void this.notifications.create(id, body.role === 'MOD' ? 'ROLE_MOD_GRANTED' : 'ROLE_MOD_REVOKED',
      body.role === 'MOD' ? 'Bạn được cấp quyền Điều hành viên' : 'Quyền Điều hành viên đã được thu hồi',
      body.role === 'MOD' ? 'Quản trị viên đã cấp cho bạn quyền hỗ trợ duyệt tài khoản và tin đăng. Đăng nhập tại trang quản trị bằng email và mật khẩu của bạn.' : 'Quản trị viên đã thu hồi quyền Điều hành viên của bạn.', 'USER', id).catch(() => undefined);
    return { success: true, data: result.rows[0], message: body.role === 'MOD' ? 'Đã cấp quyền MOD cho người dùng' : 'Đã thu hồi quyền MOD', errorCode: null };
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
    void this.notifications.create(id, 'ACCOUNT_VERIFIED', 'Tài khoản đã được xác minh', 'Chúc mừng! Tài khoản của bạn đã được xác minh và hiển thị huy hiệu Đã xác thực.', 'USER', id).catch(() => undefined);
    return { success: true, data: result.rows[0], message: 'Đã xác minh tài khoản thành công', errorCode: null };
  }
}
