import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PoolClient } from 'pg';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { IdempotencyService } from '../finance/idempotency.service';
import { LedgerWriterService } from '../finance/ledger-writer.service';

type PlanVersion = {
  id: string; version_id: string; price: string; billing_cycle: 'MONTHLY' | 'YEARLY';
  max_listings: number | null; features: unknown;
};

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly db: DatabaseService, private readonly idempotency: IdempotencyService,
    private readonly ledger: LedgerWriterService) {}

  @Get('plans')
  async plans() {
    const plans = await this.db.query(
      `SELECT p.id,p.code,p.name,v.id AS version_id,v.price,v.billing_cycle,v.max_listings,v.features
       FROM subscription_plans p JOIN subscription_plan_versions v ON v.plan_id=p.id
       WHERE p.status='ACTIVE' AND v.status='ACTIVE' AND v.effective_from<=NOW()
         AND (v.effective_to IS NULL OR v.effective_to>NOW()) ORDER BY v.price`,
    );
    return { success: true, data: plans.rows, message: null, errorCode: null };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async mine(@Req() request: { user: { id: string } }) {
    const subscription = await this.db.query(
      `SELECT s.*,p.code,p.name FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id
       WHERE s.seller_id=$1 AND s.status='ACTIVE' AND (s.ends_at IS NULL OR s.ends_at>NOW())
       ORDER BY s.created_at DESC LIMIT 1`, [request.user.id]);
    return { success: true, data: subscription.rows[0] ?? null, message: null, errorCode: null };
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchase(@Req() request: { user: { id: string } }, @Body() body: { planId: string },
    @Headers('idempotency-key') key: string | undefined) {
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim(client, 'subscription-purchase', request.user.id, key, body);
      if (claim.replay) return claim.replay;
      const plan = await this.lockActivePlanVersion(client, body.planId);
      const price = BigInt(plan.price);
      const order = await client.query<{ id: string }>(
        `INSERT INTO subscription_orders(seller_id,plan_id,plan_version_id,price_snapshot,billing_cycle_snapshot,
          max_listings_snapshot,features_snapshot,idempotency_key,status)
         VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9) RETURNING id`,
        [request.user.id, plan.id, plan.version_id, price.toString(), plan.billing_cycle, plan.max_listings,
          JSON.stringify(plan.features ?? []), claim.scopedKey, price === 0n ? 'PAID' : 'PENDING'],
      );
      let subscriptionId: string | null = null;
      if (price === 0n) {
        subscriptionId = await this.activatePlan(client, request.user.id, plan, price);
        await client.query(
          `UPDATE subscription_orders SET subscription_id=$2,paid_at=NOW(),updated_at=NOW() WHERE id=$1`,
          [order.rows[0].id, subscriptionId]);
      }
      const response = {
        success: true, data: { id: order.rows[0].id, subscriptionId, status: price === 0n ? 'PAID' : 'PENDING' },
        message: price === 0n ? 'Đã kích hoạt gói miễn phí' : 'Chờ xác nhận thanh toán', errorCode: null,
      };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return response;
    });
  }

  @Post('orders/:id/settle')
  @UseGuards(JwtAuthGuard, FinanceAdminGuard)
  async settle(@Req() request: { user: { id: string } }, @Param('id') id: string,
    @Headers('idempotency-key') key: string | undefined) {
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim(client, 'subscription-settle', request.user.id, key, { id });
      if (claim.replay) return claim.replay;
      const query = await client.query<PlanVersion & { seller_id: string; price_snapshot: string; status: string }>(
        `SELECT seller_id,plan_id AS id,plan_version_id AS version_id,price_snapshot::text,billing_cycle_snapshot AS billing_cycle,
                max_listings_snapshot AS max_listings,features_snapshot AS features,status::text
         FROM subscription_orders WHERE id=$1 FOR UPDATE`, [id]);
      const order = query.rows[0];
      if (!order || order.status !== 'PENDING') throw new BadRequestException('Yêu cầu gói không còn chờ thanh toán');
      const amount = BigInt(order.price_snapshot);
      const transaction = await client.query<{ id: string }>(
        `INSERT INTO ledger_transactions(type,reference_id,idempotency_key,status)
         VALUES('SUBSCRIPTION_PURCHASE',$1,$2,'PENDING') RETURNING id`, [id, claim.scopedKey]);
      await this.ledger.finalize(client, transaction.rows[0].id, [
        { accountCode: 'PLATFORM_CASH', amount, userId: order.seller_id },
        { accountCode: 'SUBSCRIPTION_REVENUE', amount: -amount, userId: order.seller_id },
      ]);
      const subscriptionId = await this.activatePlan(client, order.seller_id, order, amount);
      await client.query(
        `UPDATE subscription_orders SET status='PAID',ledger_transaction_id=$2,subscription_id=$3,
         paid_at=NOW(),updated_at=NOW() WHERE id=$1`, [id, transaction.rows[0].id, subscriptionId]);
      const response = { success: true, data: { id, subscriptionId }, message: 'Đã chốt doanh thu và kích hoạt gói', errorCode: null };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return response;
    });
  }

  private async lockActivePlanVersion(client: PoolClient, planId: string): Promise<PlanVersion> {
    const result = await client.query<PlanVersion>(
      `SELECT p.id,v.id AS version_id,v.price::text,v.billing_cycle,v.max_listings,v.features
       FROM subscription_plans p JOIN subscription_plan_versions v ON v.plan_id=p.id
       WHERE p.id=$1 AND p.status='ACTIVE' AND v.status='ACTIVE' AND v.effective_from<=NOW()
         AND (v.effective_to IS NULL OR v.effective_to>NOW()) FOR UPDATE OF p,v`, [planId]);
    if (!result.rows[0]) throw new BadRequestException('Gói không hợp lệ');
    return result.rows[0];
  }

  private async activatePlan(client: PoolClient, sellerId: string, plan: PlanVersion, price: bigint) {
    await client.query("UPDATE subscriptions SET status='CANCELLED' WHERE seller_id=$1 AND status='ACTIVE'", [sellerId]);
    const subscription = await client.query<{ id: string }>(
      `INSERT INTO subscriptions(seller_id,plan_id,plan_version_id,price_snapshot,billing_cycle_snapshot,
        max_listings_snapshot,features_snapshot,starts_at,ends_at)
       VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,NOW(),NOW()+CASE WHEN $5='YEARLY' THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END)
       RETURNING id`,
      [sellerId, plan.id, plan.version_id, price.toString(), plan.billing_cycle, plan.max_listings,
        JSON.stringify(plan.features ?? [])],
    );
    return subscription.rows[0].id;
  }
}
