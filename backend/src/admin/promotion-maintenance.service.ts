import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { RevenueProjectionService } from './revenue-projection.service';

/**
 * Maintains time-bound promotion state. The transaction-scoped advisory lock
 * makes this safe with several NestJS instances: only one worker performs a
 * given expiration pass, while every other instance exits without mutation.
 */
@Injectable()
export class PromotionMaintenanceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PromotionMaintenanceService.name);
  private timer: NodeJS.Timeout | undefined;
  private reportTimer: NodeJS.Timeout | undefined;

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
    private readonly projections: RevenueProjectionService,
  ) {}

  async onModuleInit() {
    if (this.config.get<string>('FINANCIAL_MAINTENANCE_ENABLED') === 'false') return;
    await Promise.all([this.runSafely(), this.refreshRevenueSafely()]);
    const configured = Number(this.config.get<string>('PROMOTION_EXPIRY_INTERVAL_MS') ?? 900_000);
    const interval = Number.isSafeInteger(configured) ? Math.max(configured, 60_000) : 900_000;
    this.timer = setInterval(() => void this.runSafely(), interval);
    this.timer.unref();
    const configuredReports = Number(this.config.get<string>('REVENUE_REPORT_REFRESH_INTERVAL_MS') ?? 3_600_000);
    const reportInterval = Number.isSafeInteger(configuredReports) ? Math.max(configuredReports, 300_000) : 3_600_000;
    this.reportTimer = setInterval(() => void this.refreshRevenueSafely(), reportInterval);
    this.reportTimer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.reportTimer) clearInterval(this.reportTimer);
  }

  async expire(actorId: string | null = null): Promise<number> {
    return this.db.transaction(async (client) => {
      const lock = await client.query<{ acquired: boolean }>('SELECT pg_try_advisory_xact_lock($1) AS acquired', [6_120_924]);
      if (!lock.rows[0]?.acquired) return 0;
      const expired = await client.query<{ id: string; product_id: string }>(
        `UPDATE promotion_activations SET status='EXPIRED'
         WHERE status='ACTIVE' AND ends_at<=NOW() RETURNING id,product_id`,
      );
      const productIds = [...new Set(expired.rows.map((row) => row.product_id))];
      if (productIds.length > 0) {
        await client.query(
          `UPDATE products p SET is_featured=FALSE
           WHERE p.id = ANY($1::uuid[]) AND NOT EXISTS (
             SELECT 1 FROM promotion_activations a
             WHERE a.product_id=p.id AND a.promotion_type='FEATURED'::promotion_type
               AND a.status='ACTIVE' AND a.ends_at>NOW()
           )`,
          [productIds],
        );
      }
      for (const activation of expired.rows) {
        await client.query(
          `INSERT INTO financial_audit_logs(actor_id,action,entity_type,entity_id,new_value,reason)
           VALUES($1,'PROMOTION_ACTIVATION_EXPIRED','PROMOTION_ACTIVATION',$2,$3::jsonb,'Promotion duration elapsed')`,
          [actorId, activation.id, JSON.stringify({ productId: activation.product_id })],
        );
      }
      return expired.rows.length;
    });
  }

  private async runSafely() {
    try {
      const expired = await this.expire();
      if (expired > 0) this.logger.log(`Expired ${expired} promotion activation(s)`);
    } catch (error) {
      this.logger.error('Promotion-expiry maintenance failed', error instanceof Error ? error.stack : undefined);
    }
  }

  private async refreshRevenueSafely() {
    try {
      const today = this.hoChiMinhDate(new Date());
      const previous = new Date(`${today}T00:00:00.000Z`);
      previous.setUTCDate(previous.getUTCDate() - 1);
      await this.projections.refresh(today, null);
      await this.projections.refresh(previous.toISOString().slice(0, 10), null);
    } catch (error) {
      this.logger.error('Revenue-projection maintenance failed', error instanceof Error ? error.stack : undefined);
    }
  }

  private hoChiMinhDate(value: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(value);
    const part = (type: string) => parts.find((item) => item.type === type)?.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
}
