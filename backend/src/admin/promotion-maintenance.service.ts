import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';
import { RevenueProjectionService } from './revenue-projection.service';
import { NotificationsService } from '../account/notifications.service';

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
  private bumpTimer: NodeJS.Timeout | undefined;

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
    private readonly projections: RevenueProjectionService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async onModuleInit() {
    if (this.config.get<string>('FINANCIAL_MAINTENANCE_ENABLED') === 'false') return;
    try {
      await this.db.query('ALTER TABLE promotion_activations ADD COLUMN IF NOT EXISTS last_bumped_at TIMESTAMPTZ');
      await this.db.query('ALTER TABLE promotion_activations ADD COLUMN IF NOT EXISTS bump_count INTEGER NOT NULL DEFAULT 0');
    } catch (error) {
      this.logger.error('Cannot prepare bump columns', error instanceof Error ? error.stack : undefined);
    }
    await Promise.all([this.runSafely(), this.refreshRevenueSafely()]);
    this.bumpTimer = setInterval(() => void this.bumpSafely(), 300_000);
    this.bumpTimer.unref();
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
    if (this.bumpTimer) clearInterval(this.bumpTimer);
  }

  async expire(actorId: string | null = null): Promise<number> {
    return this.db.transaction(async (client) => {
      const lock = await client.query<{ acquired: boolean }>('SELECT pg_try_advisory_xact_lock($1) AS acquired', [6_120_924]);
      if (!lock.rows[0]?.acquired) return 0;
      const expired = await client.query<{ id: string; product_id: string; ptype: string; bump_count: number }>(
        `UPDATE promotion_activations SET status='EXPIRED'
         WHERE status='ACTIVE' AND ends_at<=NOW() RETURNING id,product_id,promotion_type::text AS ptype,bump_count`,
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
      for (const a of expired.rows) await this.notifyOwner(client, a.product_id, 'PROMOTION_EXPIRED', 'Gói đẩy tin đã hết hạn',
        a.ptype === 'BOOST' ? `Gói đẩy tin của tin "{title}" đã hết hạn. Hệ thống đã đẩy tin tổng cộng ${a.bump_count ?? 0} lần. Mua gói mới để tiếp tục đưa tin lên đầu.` : 'Gói nổi bật của tin "{title}" đã hết hạn.');
      return expired.rows.length;
    });
  }

  /** Đẩy tin định kỳ cho các tin đang có gói BOOST còn hạn; mỗi lần đẩy gửi thông báo cho chủ tin. */
  async bump(): Promise<number> {
    const configured = Number(this.config.get<string>('PROMOTION_BUMP_INTERVAL_MS') ?? 10_800_000);
    const interval = Number.isSafeInteger(configured) ? Math.max(configured, 300_000) : 10_800_000;
    return this.db.transaction(async (client) => {
      const lock = await client.query<{ acquired: boolean }>('SELECT pg_try_advisory_xact_lock($1) AS acquired', [6_120_925]);
      if (!lock.rows[0]?.acquired) return 0;
      const due = await client.query<{ id: string; product_id: string; bump_count: number; ends_at: Date }>(
        `UPDATE promotion_activations a SET last_bumped_at=NOW(), bump_count=a.bump_count+1
         FROM products p
         WHERE p.id=a.product_id AND a.status='ACTIVE' AND a.promotion_type='BOOST'::promotion_type
           AND a.starts_at<=NOW() AND a.ends_at>NOW() AND p.status='ACTIVE' AND p.deleted_at IS NULL
           AND COALESCE(a.last_bumped_at, a.starts_at) <= NOW() - ($1::bigint * INTERVAL '1 millisecond')
         RETURNING a.id,a.product_id,a.bump_count,a.ends_at`, [interval],
      );
      const ids = [...new Set(due.rows.map((r) => r.product_id))];
      if (ids.length) await client.query('UPDATE products SET published_at=NOW() WHERE id=ANY($1::uuid[])', [ids]);
      for (const a of due.rows) {
        const end = new Date(a.ends_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        await this.notifyOwner(client, a.product_id, 'PROMOTION_BUMPED', 'Tin của bạn vừa được đẩy lên đầu',
          `Tin "{title}" vừa được hệ thống đẩy lên đầu danh sách (lần thứ ${a.bump_count}). Gói đẩy tin còn hiệu lực đến ${end}.`);
      }
      return due.rows.length;
    });
  }

  private async notifyOwner(client: { query: (sql: string, v?: unknown[]) => Promise<{ rows: any[] }> }, productId: string, type: string, title: string, content: string) {
    if (!this.notifications) return;
    try {
      const r = await client.query('SELECT seller_id::text AS uid, title FROM products WHERE id=$1', [productId]);
      const row = r.rows[0];
      if (row) await this.notifications.create(row.uid, type, title, content.replace('{title}', String(row.title ?? '')), 'PRODUCT', productId);
    } catch (error) {
      this.logger.warn(`Notify failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async bumpSafely() {
    try {
      const n = await this.bump();
      if (n > 0) this.logger.log(`Bumped ${n} boosted listing(s)`);
    } catch (error) {
      this.logger.error('Promotion-bump maintenance failed', error instanceof Error ? error.stack : undefined);
    }
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
