import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';

/** Builds the replaceable daily dashboard projection from immutable sources. */
@Injectable()
export class RevenueProjectionService {
  constructor(private readonly db: DatabaseService) {}

  async refresh(date: string, actorId: string | null): Promise<Record<string, unknown>> {
    return this.db.transaction((client) => this.refreshInTransaction(client, date, actorId));
  }

  private async refreshInTransaction(client: PoolClient, date: string, actorId: string | null): Promise<Record<string, unknown>> {
    const report = await client.query(
      `WITH order_metrics AS (
         SELECT COUNT(*)::int AS total_orders,
                COALESCE(SUM(total_amount),0)::bigint AS gmv,
                COALESCE(SUM(seller_payout_amount),0)::bigint AS seller_payout
         FROM orders WHERE order_status='COMPLETED'
           AND (completed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date=$1::date
       ), ledger_metrics AS (
         SELECT COALESCE(SUM(CASE WHEN e.account_code='PLATFORM_REVENUE' THEN -e.amount ELSE 0 END),0)::bigint AS platform_fee,
                COALESCE(SUM(CASE WHEN e.account_code='PAYMENT_PROCESSING_FEE' THEN -e.amount ELSE 0 END),0)::bigint AS payment_processing_cost,
                COALESCE(SUM(CASE WHEN e.account_code='PROMOTION_REVENUE' THEN -e.amount ELSE 0 END),0)::bigint AS promotion_revenue,
                COALESCE(SUM(CASE WHEN e.account_code='SUBSCRIPTION_REVENUE' THEN -e.amount ELSE 0 END),0)::bigint AS subscription_revenue,
                COALESCE(SUM(CASE WHEN e.account_code='ADVERTISING_REVENUE' THEN -e.amount ELSE 0 END),0)::bigint AS advertising_revenue,
                COALESCE(SUM(CASE WHEN e.account_code='SHIPPING_MARGIN' THEN -e.amount ELSE 0 END),0)::bigint AS shipping_margin
         FROM ledger_entries e JOIN ledger_transactions t ON t.id=e.transaction_id
         WHERE t.status='FINALIZED' AND (t.finalized_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date=$1::date
       ), refund_metrics AS (
         SELECT COALESCE(SUM(amount),0)::bigint AS refund_volume FROM refunds
         WHERE status='COMPLETED' AND (processed_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date=$1::date
       ) SELECT * FROM order_metrics CROSS JOIN ledger_metrics CROSS JOIN refund_metrics`, [date]);
    const values = report.rows[0] as Record<string, string | number>;
    const amount = (name: string) => BigInt(values[name] ?? 0);
    // Refund transactions already reverse the revenue accounts, so displaying
    // refund volume separately avoids deducting that impact twice.
    const netRevenue = amount('platform_fee') + amount('promotion_revenue') + amount('subscription_revenue')
      + amount('advertising_revenue') + amount('shipping_margin') - amount('payment_processing_cost');
    const upsert = await client.query<Record<string, unknown>>(
      `INSERT INTO platform_revenues(
         revenue_date,currency,total_orders,gmv,platform_fee,payment_processing_cost,seller_payout,
         promotion_revenue,subscription_revenue,advertising_revenue,shipping_margin,refund_volume,net_revenue,
         refreshed_at,updated_at
       ) VALUES($1::date,'VND',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
       ON CONFLICT(revenue_date,currency) DO UPDATE SET
         total_orders=EXCLUDED.total_orders,gmv=EXCLUDED.gmv,platform_fee=EXCLUDED.platform_fee,
         payment_processing_cost=EXCLUDED.payment_processing_cost,seller_payout=EXCLUDED.seller_payout,
         promotion_revenue=EXCLUDED.promotion_revenue,subscription_revenue=EXCLUDED.subscription_revenue,
         advertising_revenue=EXCLUDED.advertising_revenue,shipping_margin=EXCLUDED.shipping_margin,
         refund_volume=EXCLUDED.refund_volume,net_revenue=EXCLUDED.net_revenue,
         refreshed_at=NOW(),updated_at=NOW() RETURNING *`,
      [date, values.total_orders ?? 0, amount('gmv').toString(), amount('platform_fee').toString(),
        amount('payment_processing_cost').toString(), amount('seller_payout').toString(), amount('promotion_revenue').toString(),
        amount('subscription_revenue').toString(), amount('advertising_revenue').toString(), amount('shipping_margin').toString(),
        amount('refund_volume').toString(), netRevenue.toString()],
    );
    await client.query(
      `INSERT INTO financial_audit_logs(actor_id,action,entity_type,entity_id,new_value,reason)
       VALUES($1,'PLATFORM_REVENUE_REFRESH','PLATFORM_REVENUE',$2,$3::jsonb,'Rebuilt from finalized ledger')`,
      [actorId, upsert.rows[0].id, JSON.stringify({ revenueDate: date })],
    );
    return upsert.rows[0];
  }
}
