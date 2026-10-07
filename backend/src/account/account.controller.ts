import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards, Query } from '@nestjs/common';
import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { triggerTrustRecalc } from '../trust/trust.service';

class RegisterPushDeviceDto {
  @IsString() @MinLength(20) @MaxLength(4096) token!: string;
  @IsIn(['ANDROID','IOS']) platform!: 'ANDROID' | 'IOS';
}

export class UpdateProfileDto {
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(2) @MaxLength(120) fullName?: string;
  @IsOptional() @IsString() @MaxLength(500000) @Matches(/^(data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|https:\/\/\S+)$/, { message: 'Ảnh đại diện không hợp lệ (chỉ JPG, PNG, WebP).' }) avatarUrl?: string;
}

export class DeleteAccountDto {
  @IsOptional() @IsString() @MaxLength(100) password?: string;
  @IsOptional() @IsString() @MaxLength(10) confirm?: string;
}

export class ChangePasswordDto {
  @IsString() @MinLength(6) @MaxLength(100) currentPassword!: string;
  @IsString() @MinLength(6) @MaxLength(100) newPassword!: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly db: DatabaseService) {}

  @Get('me')
  async me(@Req() request: { user: { id: string } }) {
    const result = await this.db.query('SELECT id,full_name,email,phone,avatar_url,role,phone_verified,email_verified FROM users WHERE id=$1', [request.user.id]);
    return { success: true, data: result.rows[0], message: null, errorCode: null };
  }

  @Patch('me')
  async update(@Req() request: { user: { id: string } }, @Body() body: UpdateProfileDto) {
    const result = await this.db.query(
      `UPDATE users SET full_name=COALESCE($1,full_name), avatar_url=COALESCE($2,avatar_url), avatar_custom=CASE WHEN $2::text IS NOT NULL AND $2::text !~* '(googleusercontent|fbcdn|facebook\.com|fbsbx|zdn\.vn|zalo|appleid|apple\.com)' THEN TRUE ELSE avatar_custom END, updated_at=NOW() WHERE id=$3 RETURNING id, full_name, avatar_url, email, role`,
      [body.fullName || null, body.avatarUrl || null, request.user.id]
    );
    if (body.avatarUrl) triggerTrustRecalc(request.user.id, 'portrait_updated');
    return { success: true, data: result.rows[0], message: 'Đã cập nhật thông tin cá nhân thành công', errorCode: null };
  }

  @Post('me/change-password')
  async changePassword(@Req() request: { user: { id: string } }, @Body() body: ChangePasswordDto) {
    const user = (await this.db.query('SELECT password_hash FROM users WHERE id=$1', [request.user.id])).rows[0];
    if (!user || !user.password_hash) throw new BadRequestException('Tài khoản không hợp lệ');

    const valid = await bcrypt.compare(body.currentPassword, user.password_hash);
    if (!valid) throw new BadRequestException('Mật khẩu hiện tại chưa chính xác');

    const newHash = await bcrypt.hash(body.newPassword, 10);
    await this.db.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [newHash, request.user.id]);
    return { success: true, data: { id: request.user.id }, message: 'Đã đổi mật khẩu thành công', errorCode: null };
  }

  @Get('notifications')
  async notices(@Req() request: { user: { id: string } }, @Query('limit') limitRaw?: string, @Query('offset') offsetRaw?: string, @Query('unread') unread?: string) {
    const limit = Math.min(Math.max(parseInt(limitRaw ?? '50', 10) || 50, 1), 100);
    const offset = Math.min(Math.max(parseInt(offsetRaw ?? '0', 10) || 0, 0), 5000);
    const result = await this.db.query(`SELECT id,type,title,content,reference_type,reference_id,is_read,created_at,read_at FROM notifications WHERE user_id=$1 ${unread === '1' ? 'AND is_read=false' : ''} ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [request.user.id, limit, offset]);
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  @Get('notifications/unread-count')
  async unreadCount(@Req() request: { user: { id: string } }) {
    const result = await this.db.query('SELECT count(*)::int AS count FROM notifications WHERE user_id=$1 AND is_read=false', [request.user.id]);
    return { success: true, data: { count: result.rows[0].count }, message: null, errorCode: null };
  }

  @Patch('notifications/:id/read')
  async read(@Req() request: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.db.query('UPDATE notifications SET is_read=true,read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND user_id=$2 RETURNING id,is_read,read_at', [id, request.user.id]);
    return { success: true, data: result.rows[0] ?? null, message: null, errorCode: null };
  }

  @Patch('notifications/read-all')
  async readAll(@Req() request: { user: { id: string } }) {
    const result = await this.db.query('UPDATE notifications SET is_read=true,read_at=COALESCE(read_at,NOW()) WHERE user_id=$1 AND is_read=false', [request.user.id]);
    return { success: true, data: { updated: result.rowCount ?? 0 }, message: null, errorCode: null };
  }

  /**
   * Người dùng tự xóa tài khoản (yêu cầu của Google Play / App Store).
   * Ẩn danh hóa thay vì xóa cứng để giữ lịch sử đơn hàng/giao dịch hợp lệ cho bên còn lại.
   */
  @Delete('me')
  async deleteMe(@Req() request: { user: { id: string } }, @Body() body: DeleteAccountDto) {
    const uid = request.user.id;
    const user = (await this.db.query<{ password_hash: string | null; status: string }>('SELECT password_hash, status::text AS status FROM users WHERE id=$1', [uid])).rows[0];
    if (!user || user.status === 'DELETED') throw new BadRequestException('Tài khoản không tồn tại.');
    if (user.password_hash) {
      if (!body?.password) throw new BadRequestException('Vui lòng nhập mật khẩu để xác nhận xóa tài khoản.');
      if (!(await bcrypt.compare(body.password, user.password_hash))) throw new BadRequestException('Mật khẩu không đúng.');
    } else if ((body?.confirm ?? '').trim().toUpperCase() !== 'XOA') {
      throw new BadRequestException('Vui lòng nhập XOA để xác nhận xóa tài khoản.');
    }
    const open = (await this.db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM orders WHERE (buyer_id=$1 OR seller_id=$1) AND status::text NOT IN ('COMPLETED','CANCELLED','REFUNDED','CLOSED')`, [uid]).catch(() => ({ rows: [{ n: 0 }] }))).rows[0].n;
    if (open > 0) throw new BadRequestException(`Bạn còn ${open} đơn hàng đang xử lý. Vui lòng hoàn tất hoặc hủy đơn trước khi xóa tài khoản.`);
    await this.db.transaction(async c => {
      await c.query(`UPDATE products SET status='DELETED'::product_status, deleted_at=COALESCE(deleted_at,NOW()), updated_at=NOW() WHERE seller_id=$1 AND status::text NOT IN ('SOLD','DELETED')`, [uid]);
      await c.query(`UPDATE push_devices SET active=FALSE, updated_at=NOW() WHERE user_id=$1`, [uid]);
      for (const sql of [`DELETE FROM favorites WHERE user_id=$1`, `DELETE FROM saved_searches WHERE user_id=$1`, `DELETE FROM notification_prefs WHERE user_id=$1`]) {
        await c.query('SAVEPOINT s'); try { await c.query(sql, [uid]); await c.query('RELEASE SAVEPOINT s'); } catch { await c.query('ROLLBACK TO SAVEPOINT s'); }
      }
      await c.query(`UPDATE users SET status='DELETED'::user_status, email=NULL, phone=NULL, password_hash=NULL, avatar_url=NULL, full_name='Tài khoản đã xóa', phone_verified=FALSE, email_verified=FALSE, updated_at=NOW() WHERE id=$1`, [uid]);
    });
    return { success: true, data: null, message: 'Tài khoản của bạn đã được xóa.', errorCode: null };
  }

  @Post('me/push-devices')
  async registerPushDevice(@Req() request: { user: { id: string } }, @Body() body: RegisterPushDeviceDto) {
    const result = await this.db.query(
      `INSERT INTO push_devices(user_id,token,platform,active,last_seen_at)
       VALUES($1,$2,$3,TRUE,NOW())
       ON CONFLICT(token) DO UPDATE SET user_id=EXCLUDED.user_id,platform=EXCLUDED.platform,active=TRUE,last_seen_at=NOW(),updated_at=NOW()
       RETURNING id,platform,last_seen_at`,
      [request.user.id, body.token, body.platform],
    );
    return { success: true, data: result.rows[0], message: null, errorCode: null };
  }
}
