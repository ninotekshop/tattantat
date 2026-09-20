import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

/** Makes expired commercial entitlements explicit and auditable. */
@Injectable()
export class CommercialLifecycleMaintenanceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommercialLifecycleMaintenanceService.name);
  private timer: NodeJS.Timeout | undefined;

  constructor(private readonly db: DatabaseService, private readonly config: ConfigService) {}

  async onModuleInit() {
    if (this.config.get<string>('FINANCIAL_MAINTENANCE_ENABLED') === 'false') return;
    await this.runSafely();
    const raw = Number(this.config.get<string>('COMMERCIAL_LIFECYCLE_INTERVAL_MS') ?? 900_000);
    const interval = Number.isSafeInteger(raw) ? Math.max(raw, 60_000) : 900_000;
    this.timer = setInterval(() => void this.runSafely(), interval);
    this.timer.unref();
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  async expire(): Promise<{ subscriptions: number; campaigns: number }> {
    return this.db.transaction(async (client) => {
      const lock = await client.query<{ acquired: boolean }>('SELECT pg_try_advisory_xact_lock($1) AS acquired', [6_120_925]);
      if (!lock.rows[0]?.acquired) return { subscriptions: 0, campaigns: 0 };
      const subscriptions = await client.query<{ id: string; seller_id: string }>(
        `UPDATE subscriptions SET status='EXPIRED' WHERE status='ACTIVE' AND ends_at IS NOT NULL AND ends_at<=NOW()
         RETURNING id,seller_id`,
      );
      const campaigns = await client.query<{ id: string; seller_id: string }>(
        `UPDATE advertising_campaigns SET status='EXPIRED',updated_at=NOW()
         WHERE status='ACTIVE' AND end_at IS NOT NULL AND end_at<=NOW() RETURNING id,seller_id`,
      );
      for (const subscription of subscriptions.rows) {
        await client.query(
          `INSERT INTO financial_audit_logs(action,entity_type,entity_id,new_value,reason)
           VALUES('SUBSCRIPTION_EXPIRED','SUBSCRIPTION',$1,$2::jsonb,'Subscription term elapsed')`,
          [subscription.id, JSON.stringify({ sellerId: subscription.seller_id })],
        );
      }
      for (const campaign of campaigns.rows) {
        await client.query(
          `INSERT INTO financial_audit_logs(action,entity_type,entity_id,new_value,reason)
           VALUES('ADVERTISING_CAMPAIGN_EXPIRED','ADVERTISING_CAMPAIGN',$1,$2::jsonb,'Campaign end time elapsed')`,
          [campaign.id, JSON.stringify({ sellerId: campaign.seller_id })],
        );
      }
      return { subscriptions: subscriptions.rows.length, campaigns: campaigns.rows.length };
    });
  }

  private async runSafely() {
    try {
      const result = await this.expire();
      if (result.subscriptions || result.campaigns) this.logger.log(`Expired ${result.subscriptions} subscription(s), ${result.campaigns} campaign(s)`);
    } catch (error) {
      this.logger.error('Commercial lifecycle maintenance failed', error instanceof Error ? error.stack : undefined);
    }
  }
}
