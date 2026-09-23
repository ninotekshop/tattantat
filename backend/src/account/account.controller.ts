import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';

class RegisterPushDeviceDto {
  @IsString() @MinLength(20) @MaxLength(4096) token!: string;
  @IsIn(['ANDROID','IOS']) platform!: 'ANDROID' | 'IOS';
}

export class UpdateProfileDto {
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MinLength(2) @MaxLength(120) fullName?: string;
  @IsOptional() @IsString() @MaxLength(500000) avatarUrl?: string;
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
      'UPDATE users SET full_name=COALESCE($1,full_name), avatar_url=COALESCE($2,avatar_url), updated_at=NOW() WHERE id=$3 RETURNING id, full_name, avatar_url, email, role',
      [body.fullName || null, body.avatarUrl || null, request.user.id]
    );
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
  async notices(@Req() request: { user: { id: string } }) {
    const result = await this.db.query('SELECT id,type,title,content,reference_type,reference_id,is_read,created_at,read_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [request.user.id]);
    return { success: true, data: result.rows, message: null, errorCode: null };
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
