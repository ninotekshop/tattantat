import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { TrustService } from './trust.service';

class ApplyReferralDto { @IsString() @MaxLength(20) code!: string }

@Controller()
export class TrustController {
  constructor(private readonly trust: TrustService, private readonly db: DatabaseService) {}

  /** Công khai: chỉ trả điểm, sao, cấp độ và tiêu chí đạt/chưa đạt — không có dữ liệu nhạy cảm. */
  @Get('users/:userId/trust-score')
  async publicScore(@Param('userId', new ParseUUIDPipe()) userId: string) {
    const r = await this.trust.getTrustScore(userId);
    if (!r) throw new NotFoundException('Không tìm thấy thành viên');
    return { success: true, data: r, message: null, errorCode: null };
  }

  @Get('me/referral')
  @UseGuards(JwtAuthGuard)
  async myReferral(@Req() req: { user: { id: string } }) {
    return { success: true, data: await this.trust.referralSummary(req.user.id), message: null, errorCode: null };
  }

  @Post('me/referral')
  @UseGuards(JwtAuthGuard)
  async applyReferral(@Req() req: { user: { id: string } }, @Body() body: ApplyReferralDto) {
    const r = await this.trust.applyReferral(req.user.id, body.code);
    return { success: r.ok, data: null, message: r.message, errorCode: r.ok ? null : 'REFERRAL_REJECTED' };
  }

  /** Quản trị: xem nguồn điểm (chỉ đọc, không có API sửa điểm). */
  @Get('admin/users/:userId/trust-score')
  @UseGuards(JwtAuthGuard, FinanceAdminGuard)
  async adminScore(@Param('userId', new ParseUUIDPipe()) userId: string) {
    const r = await this.trust.recalculateTrustScore(userId, 'admin_view');
    if (!r) throw new NotFoundException('Không tìm thấy thành viên');
    const logs = (await this.db.query(`SELECT old_score, new_score, reason, created_at FROM user_trust_score_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10`, [userId])).rows;
    return { success: true, data: { ...r, history: logs }, message: null, errorCode: null };
  }
}
