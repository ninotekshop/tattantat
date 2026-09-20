import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';

@Controller('admin/pricing-rules')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class PricingAdminController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async list() {
    const result = await this.db.query(
      `SELECT r.id,r.code,r.kind::text,r.currency,r.status,v.id AS active_version_id,v.rate_bps,v.fixed_amount::text,
              v.effective_from,v.effective_to,v.reason
       FROM pricing_rules r
       LEFT JOIN LATERAL (SELECT * FROM pricing_versions v WHERE v.rule_id=r.id AND v.effective_from<=NOW()
         AND (v.effective_to IS NULL OR v.effective_to>NOW()) ORDER BY v.effective_from DESC LIMIT 1) v ON TRUE
       ORDER BY r.code`,
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  @Post(':code/versions')
  async createVersion(@Req() request: { user: { id: string } }, @Param('code') code: string,
    @Body() body: { rateBps: number | string; reason: string; effectiveFrom?: string }) {
    const rateBps = Number(body.rateBps);
    if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10_000) throw new BadRequestException('rateBps phải là số nguyên từ 0 đến 10000');
    if (!body.reason || body.reason.trim().length < 3 || body.reason.trim().length > 500) throw new BadRequestException('Cần nêu lý do thay đổi biểu phí');
    const effectiveFrom = body.effectiveFrom ? new Date(body.effectiveFrom) : new Date();
    if (Number.isNaN(effectiveFrom.getTime()) || effectiveFrom.getTime() < Date.now() - 60_000) throw new BadRequestException('effectiveFrom phải là hiện tại hoặc tương lai');
    return this.db.transaction(async (client) => {
      const ruleResult = await client.query<{ id: string; status: string }>('SELECT id,status FROM pricing_rules WHERE code=$1 FOR UPDATE', [code]);
      const rule = ruleResult.rows[0];
      if (!rule || rule.status !== 'ACTIVE') throw new BadRequestException('Pricing rule không hoạt động');
      const current = await client.query<{ id: string; rate_bps: number; fixed_amount: string; effective_from: Date }>(
        `SELECT id,rate_bps,fixed_amount::text,effective_from FROM pricing_versions
         WHERE rule_id=$1 AND effective_from<=$2 AND (effective_to IS NULL OR effective_to>$2)
         ORDER BY effective_from DESC LIMIT 1 FOR UPDATE`, [rule.id, effectiveFrom]);
      if (current.rows[0]) await client.query('UPDATE pricing_versions SET effective_to=$2 WHERE id=$1', [current.rows[0].id, effectiveFrom]);
      const version = await client.query<{ id: string; rate_bps: number; effective_from: Date }>(
        `INSERT INTO pricing_versions(rule_id,rate_bps,fixed_amount,effective_from,created_by,reason)
         VALUES($1,$2,0,$3,$4,$5) RETURNING id,rate_bps,effective_from`,
        [rule.id, rateBps, effectiveFrom, request.user.id, body.reason.trim()],
      );
      await client.query(
        `INSERT INTO financial_audit_logs(actor_id,action,entity_type,entity_id,old_value,new_value,reason)
         VALUES($1,'PRICING_VERSION_CREATED','PRICING_RULE',$2,$3::jsonb,$4::jsonb,$5)`,
        [request.user.id, rule.id, JSON.stringify(current.rows[0] ?? null), JSON.stringify({ ...version.rows[0], rateBps }), body.reason.trim()],
      );
      return { success: true, data: version.rows[0], message: 'Đã tạo pricing version mới; đơn cũ giữ nguyên snapshot', errorCode: null };
    });
  }
}
