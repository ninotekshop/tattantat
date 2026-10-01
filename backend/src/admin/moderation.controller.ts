import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const reportStates = ['OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED'] as const;
type ReportState = (typeof reportStates)[number];

class UpdateReportDto {
  @IsIn(reportStates) status!: ReportState;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class ModerationController {
  constructor(private readonly db: DatabaseService) {}


  /** Gửi thông báo cho người báo cáo và (nếu tin bị ẩn) người bán. Lỗi thông báo không làm hỏng việc xử lý. */
  private async notifyOutcome(reportId: string, outcome: 'RESOLVED' | 'REJECTED' | 'HIDDEN', note: string) {
    try {
      const r = (await this.db.query(
        `SELECT r.reporter_id, p.title, p.seller_id FROM content_reports r LEFT JOIN products p ON p.id=r.product_id WHERE r.id=$1`, [reportId])).rows[0] as
        { reporter_id: string; title: string | null; seller_id: string | null } | undefined;
      if (!r) return;
      const what = r.title ? ` về tin “${r.title}”` : '';
      const extra = note ? ` Ghi chú từ quản trị viên: ${note}` : '';
      const reporterText = outcome === 'REJECTED'
        ? `Cảm ơn bạn đã gửi báo cáo${what}. Sau khi xem xét, quản trị viên chưa thấy vi phạm nên không xử lý thêm.${extra}`
        : `Cảm ơn bạn đã báo cáo${what}. Quản trị viên đã xử lý báo cáo của bạn${outcome === 'HIDDEN' ? ' và ẩn tin đăng vi phạm' : ''}. Cảm ơn bạn đã góp phần giữ Tất Tần Tật an toàn!${extra}`;
      await this.db.query(`INSERT INTO notifications(user_id,type,title,content) VALUES($1,'REPORT_RESOLVED',$2,$3)`,
        [r.reporter_id, outcome === 'REJECTED' ? 'Báo cáo của bạn đã được xem xét' : 'Báo cáo của bạn đã được xử lý', reporterText]);
      if (outcome === 'HIDDEN' && r.seller_id && r.seller_id !== r.reporter_id) {
        await this.db.query(`INSERT INTO notifications(user_id,type,title,content) VALUES($1,'LISTING_HIDDEN',$2,$3)`,
          [r.seller_id, 'Tin đăng của bạn đã bị ẩn', `Tin “${r.title ?? ''}” đã bị ẩn do bị báo cáo vi phạm tiêu chuẩn cộng đồng.${extra} Nếu cần hỗ trợ, hãy liên hệ quản trị viên.`]);
      }
    } catch { /* bỏ qua */ }
  }

  @Get()
  async list(@Query('status') rawStatus?: string, @Query('limit') rawLimit?: string) {
    const status = rawStatus?.toUpperCase();
    if (status && !reportStates.includes(status as ReportState)) throw new BadRequestException('Trạng thái báo cáo không hợp lệ');
    const limit = Math.min(Math.max(Number(rawLimit) || 50, 1), 100);
    const result = await this.db.query(
      `SELECT r.id,r.reason,r.details,r.status,r.created_at,r.reviewed_at,r.resolution_note,
              reporter.id AS reporter_id,reporter.full_name AS reporter_name,
              target.id AS reported_user_id,target.full_name AS reported_user_name,
              p.id AS product_id,p.title AS product_title,p.status::text AS product_status,
              reviewer.id AS reviewed_by,reviewer.full_name AS reviewer_name
       FROM content_reports r
       JOIN users reporter ON reporter.id=r.reporter_id
       LEFT JOIN users target ON target.id=r.reported_user_id
       LEFT JOIN products p ON p.id=r.product_id
       LEFT JOIN users reviewer ON reviewer.id=r.reviewed_by
       WHERE ($1::text IS NULL OR r.status=$1)
       ORDER BY CASE r.status WHEN 'OPEN' THEN 0 WHEN 'REVIEWING' THEN 1 ELSE 2 END,r.created_at DESC
       LIMIT $2`,
      [status ?? null, limit],
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  @Patch(':id')
  async update(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body() body: UpdateReportDto) {
    const report = await this.db.transaction(async (client) => {
      const existing = await client.query<{ id: string; status: ReportState }>('SELECT id,status FROM content_reports WHERE id=$1 FOR UPDATE', [id]);
      if (!existing.rows[0]) throw new BadRequestException('Không tìm thấy báo cáo');
      const current = existing.rows[0];
      const updated = await client.query(
        `UPDATE content_reports
         SET status=$2,reviewed_by=$3,reviewed_at=NOW(),resolution_note=$4
         WHERE id=$1
         RETURNING id,status,reviewed_by,reviewed_at,resolution_note`,
        [id, body.status, request.user.id, body.note?.trim() || null],
      );
      await client.query(
        `INSERT INTO moderation_audit_logs(report_id,actor_id,old_status,new_status,note)
         VALUES($1,$2,$3,$4,$5)`,
        [id, request.user.id, current.status, body.status, body.note?.trim() || null],
      );
      return updated.rows[0];
    });
    if (body.status === 'RESOLVED' || body.status === 'REJECTED') await this.notifyOutcome(id, body.status, body.note?.trim() ?? '');
    return { success: true, data: report, message: null, errorCode: null };
  }

  @Post(':id/hide-product')
  async hideReportedProduct(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body('note') rawNote?: string) {
    const note = typeof rawNote === 'string' ? rawNote.trim().slice(0, 1000) : '';
    const report = await this.db.transaction(async (client) => {
      const existing = await client.query<{ id: string; status: ReportState; product_id: string | null }>(
        'SELECT id,status,product_id FROM content_reports WHERE id=$1 FOR UPDATE', [id],
      );
      const current = existing.rows[0];
      if (!current) throw new BadRequestException('Không tìm thấy báo cáo');
      if (!current.product_id) throw new BadRequestException('Báo cáo này không gắn với tin đăng');
      const product = await client.query<{ id: string }>(
        `UPDATE products SET status='HIDDEN',updated_at=NOW()
         WHERE id=$1 AND deleted_at IS NULL RETURNING id`, [current.product_id],
      );
      if (!product.rows[0]) throw new BadRequestException('Tin đăng không còn tồn tại');
      const updated = await client.query(
        `UPDATE content_reports SET status='RESOLVED',reviewed_by=$2,reviewed_at=NOW(),resolution_note=$3
         WHERE id=$1 RETURNING id,status,reviewed_by,reviewed_at,resolution_note`,
        [id, request.user.id, note || 'Đã ẩn tin đăng vi phạm'],
      );
      await client.query(
        `INSERT INTO moderation_audit_logs(report_id,actor_id,old_status,new_status,note)
         VALUES($1,$2,$3,'RESOLVED',$4)`,
        [id, request.user.id, current.status, `HIDE_PRODUCT: ${note || 'Đã ẩn tin đăng vi phạm'}`],
      );
      return updated.rows[0];
    });
    await this.notifyOutcome(id, 'HIDDEN', note);
    return { success: true, data: report, message: 'Đã ẩn tin đăng và đóng báo cáo', errorCode: null };
  }
}
