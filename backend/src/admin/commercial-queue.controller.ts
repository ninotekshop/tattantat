import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';

@Controller('admin/commercial')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class CommercialQueueController {
  constructor(private readonly db: DatabaseService) {}

  /** One queue for manual settlement/support of every paid commercial product. */
  @Get('queue')
  async queue(@Query('status') rawStatus?: string, @Query('limit') rawLimit?: string) {
    const status = rawStatus ?? 'OPEN';
    if (!['OPEN', 'PENDING', 'PAID', 'CANCELLED', 'FAILED', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED'].includes(status)) {
      throw new BadRequestException('status không hợp lệ');
    }
    const requested = Number(rawLimit ?? 100);
    if (!Number.isSafeInteger(requested) || requested < 1 || requested > 500) throw new BadRequestException('limit không hợp lệ');
    const result = await this.db.query(
      `SELECT * FROM (
         SELECT o.id,'PROMOTION'::text AS kind,o.status,u.id AS seller_id,u.full_name AS seller_name,
                o.package_price_snapshot::text AS amount,'VND'::text AS currency,o.created_at,
                p.code AS product_code,p.name AS product_name
         FROM promotion_orders o JOIN users u ON u.id=o.seller_id JOIN promotion_packages p ON p.id=o.package_id
         UNION ALL
         SELECT o.id,'SUBSCRIPTION'::text AS kind,o.status,u.id AS seller_id,u.full_name AS seller_name,
                o.price_snapshot::text AS amount,'VND'::text AS currency,o.created_at,
                p.code AS product_code,p.name AS product_name
         FROM subscription_orders o JOIN users u ON u.id=o.seller_id JOIN subscription_plans p ON p.id=o.plan_id
         UNION ALL
         SELECT c.id,'ADVERTISING'::text AS kind,c.status,u.id AS seller_id,u.full_name AS seller_name,
                c.budget::text AS amount,'VND'::text AS currency,c.created_at,
                c.campaign_type AS product_code,COALESCE(pr.title,'Campaign') AS product_name
         FROM advertising_campaigns c JOIN users u ON u.id=c.seller_id LEFT JOIN products pr ON pr.id=c.product_id
       ) q WHERE ($1='OPEN' AND q.status IN ('PENDING','PENDING_PAYMENT')) OR q.status=$1
       ORDER BY q.created_at ASC LIMIT $2`,
      [status, requested],
    );
    return { success: true, data: result.rows, meta: { status, limit: requested }, message: null, errorCode: null };
  }
}
