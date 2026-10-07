import { BadRequestException, Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationsService } from '../account/notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { ModeratorGuard } from '../admin/moderator.guard';
import { ModerationBacklogService } from './moderation-backlog.service';
import { ModerationPolicyService, type ModerationSettings } from './moderation-policy.service';
import { triggerTrustRecalc } from '../trust/trust.service';

class SettingsDto { @IsObject() settings!: Partial<ModerationSettings>; }
class BulkDto {
  @IsArray() ids!: string[];
  @IsIn(['approve', 'reject']) action!: 'approve' | 'reject';
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
type Req_ = { user: { id: string } };

@Controller('admin/moderation')
@UseGuards(JwtAuthGuard, ModeratorGuard)
export class ModerationAdminController {
  constructor(private readonly policy: ModerationPolicyService, private readonly db: DatabaseService, private readonly notifications: NotificationsService, private readonly backlogService: ModerationBacklogService) {}

  @Get('settings') async settings() { return { success: true, data: await this.policy.settings(true), message: null, errorCode: null }; }
  @Put('settings') @UseGuards(FinanceAdminGuard) save(@Req() r: Req_, @Body() dto: SettingsDto) { return this.policy.saveSettings(r.user.id, dto.settings ?? {}); }
  /** Số tin chờ duyệt và quá hạn, dùng cho huy hiệu ở menu quản trị. */
  @Get('summary') async summary() { const s = await this.policy.settings(); return { success: true, data: await this.policy.backlog(s.backlogHours), message: null, errorCode: null }; }
  @Post('remind-now') @UseGuards(FinanceAdminGuard) async remindNow() { const sent = await this.backlogService.run(true); return { success: true, data: { sent }, message: sent ? `Đã gửi nhắc tới ${sent} quản trị viên.` : 'Hiện không có tin nào chờ quá hạn.', errorCode: null }; }
  @Get('queue') queue() { return this.policy.queue(); }
  @Get('history') history() { return this.policy.history(); }

  /** Duyệt hoặc từ chối hàng loạt các tin đang chờ. Mỗi tin ghi nhật ký và báo cho người bán. */
  @Post('bulk')
  async bulk(@Req() r: Req_, @Body() dto: BulkDto) {
    const ids = [...new Set((dto.ids ?? []).map(String))];
    if (!ids.length || ids.length > 100 || ids.some(id => !/^[0-9a-f-]{36}$/i.test(id))) throw new BadRequestException('Danh sách tin không hợp lệ (tối đa 100 tin).');
    const reason = String(dto.reason ?? '').trim();
    if (dto.action === 'reject' && reason.length < 3) throw new BadRequestException('Nhập lý do từ chối (tối thiểu 3 ký tự).');
    const rows = dto.action === 'approve'
      ? (await this.db.query(`UPDATE products SET status='ACTIVE', published_at=COALESCE(published_at,NOW()), updated_at=NOW() WHERE id=ANY($1::uuid[]) AND status='PENDING_REVIEW' AND deleted_at IS NULL RETURNING id, seller_id, title`, [ids])).rows
      : (await this.db.query(`UPDATE products SET status='REJECTED', updated_at=NOW() WHERE id=ANY($1::uuid[]) AND status='PENDING_REVIEW' AND deleted_at IS NULL RETURNING id, seller_id, title`, [ids])).rows;
    for (const row of rows) {
      triggerTrustRecalc(row.seller_id, dto.action === 'approve' ? 'listing_approved' : 'listing_rejected');
      await this.policy.logEvent(row.id, 'ADMIN', dto.action === 'approve' ? 'APPROVED' : 'REJECTED', reason ? [reason] : [], r.user.id);
      void this.notifications.create(row.seller_id, dto.action === 'approve' ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
        dto.action === 'approve' ? 'Tin đăng đã được duyệt' : 'Tin đăng bị từ chối',
        dto.action === 'approve' ? `Tin “${row.title}” đã được duyệt và đang hiển thị.` : `Tin “${row.title}” bị từ chối. Lý do: ${reason}`, 'PRODUCT', row.id).catch(() => undefined);
    }
    return { success: true, data: { processed: rows.length, skipped: ids.length - rows.length }, message: `Đã ${dto.action === 'approve' ? 'duyệt' : 'từ chối'} ${rows.length} tin.`, errorCode: null };
  }
}
