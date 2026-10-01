import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { AdminAuditLogService } from './admin-audit-log.service';

class BroadcastDto {
  @IsString() @MinLength(3) @MaxLength(200) title!: string;
  @IsString() @MinLength(3) @MaxLength(2000) content!: string;
  @IsIn(['ALL', 'SELLERS', 'USER']) audience!: 'ALL' | 'SELLERS' | 'USER';
  @IsOptional() @IsUUID() userId?: string;
}

/** Thông báo từ quản trị viên tới người dùng (toàn hệ thống, người bán hoặc một người). */
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminNotificationsController {
  constructor(private readonly db: DatabaseService, private readonly audit: AdminAuditLogService) {}

  @Post('broadcast')
  async broadcast(@Req() request: { user: { id: string } }, @Body() dto: BroadcastDto) {
    const title = dto.title.trim(); const content = dto.content.trim();
    if (title.length < 3 || content.length < 3) throw new BadRequestException('Tiêu đề và nội dung tối thiểu 3 ký tự.');
    let count = 0;
    if (dto.audience === 'USER') {
      if (!dto.userId) throw new BadRequestException('Chọn người nhận.');
      count = (await this.db.query(`INSERT INTO notifications(user_id,type,title,content) SELECT id,'ADMIN_ANNOUNCEMENT',$2,$3 FROM users WHERE id=$1 AND deleted_at IS NULL`, [dto.userId, title, content])).rowCount ?? 0;
    } else {
      const where = dto.audience === 'SELLERS' ? `AND EXISTS(SELECT 1 FROM products p WHERE p.seller_id=u.id AND p.deleted_at IS NULL)` : '';
      count = (await this.db.query(`INSERT INTO notifications(user_id,type,title,content) SELECT u.id,'ADMIN_ANNOUNCEMENT',$1,$2 FROM users u WHERE u.status='ACTIVE' AND u.deleted_at IS NULL ${where}`, [title, content])).rowCount ?? 0;
    }
    await this.audit.log(request.user.id, 'Super Admin', 'NOTIFICATION_BROADCAST', 'Notification', dto.userId ?? dto.audience, { title, audience: dto.audience, count });
    return { success: true, data: { count }, message: `Đã gửi thông báo tới ${count} người dùng.`, errorCode: null };
  }

  @Get('recent')
  async recent() {
    const result = await this.db.query(`SELECT title, content, count(*)::int AS recipients, max(created_at) AS "sentAt" FROM notifications WHERE type='ADMIN_ANNOUNCEMENT' AND created_at>NOW()-INTERVAL '30 days' GROUP BY title, content ORDER BY max(created_at) DESC LIMIT 20`);
    return { success: true, data: result.rows, message: null, errorCode: null };
  }
}
