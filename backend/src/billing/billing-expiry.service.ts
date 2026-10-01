import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../account/notifications.service';
import { DatabaseService } from '../database/database.service';

type Stage = { key: '3D' | '1D'; from: string; to: string; back: string };
/** Mốc nhắc: còn 3 ngày, còn 1 ngày và vừa hết hạn (trong 7 ngày gần nhất). */
const STAGES: Stage[] = [
  { key: '3D', from: `interval '1 day'`, to: `interval '3 days'`, back: `interval '4 days'` },
  { key: '1D', from: `interval '0'`, to: `interval '1 day'`, back: `interval '2 days'` },
];

/**
 * Nhắc người bán khi gói đăng tin hoặc gói đẩy tin sắp hết hạn / vừa hết hạn.
 * Mỗi mốc chỉ nhắc một lần cho mỗi kỳ hạn (gia hạn sẽ tạo kỳ hạn mới, nên được nhắc lại đúng lúc).
 */
@Injectable()
export class BillingExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('BillingExpiry');
  private timer?: NodeJS.Timeout;
  constructor(private readonly db: DatabaseService, private readonly notifications: NotificationsService) {}

  onModuleInit() {
    if (process.env.BILLING_EXPIRY_REMINDER === 'false') return;
    const configured = Number(process.env.BILLING_EXPIRY_INTERVAL_MS ?? 3_600_000);
    const interval = Number.isSafeInteger(configured) ? Math.max(configured, 60_000) : 3_600_000;
    setTimeout(() => void this.runSafely(), 45_000).unref();
    this.timer = setInterval(() => void this.runSafely(), interval);
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  private async runSafely() { try { await this.run(); } catch (e) { this.log.warn('Không chạy được nhắc hết hạn: ' + (e instanceof Error ? e.message : String(e))); } }

  /** Trả về số thông báo đã gửi. */
  async run(): Promise<number> {
    const locked = await this.db.transaction(async c => (await c.query(`SELECT pg_try_advisory_xact_lock(hashtext('billing-expiry-reminder')) AS ok`)).rows[0].ok as boolean);
    if (!locked) return 0;
    let sent = 0;
    // Gói đăng tin / cửa hàng
    for (const st of STAGES) {
      const rows = (await this.db.query(`
        SELECT s.id::text, s.seller_id::text AS uid, p.name, s.ends_at
        FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id
        WHERE s.status='ACTIVE' AND s.ends_at IS NOT NULL AND s.ends_at > NOW()+${st.from} AND s.ends_at <= NOW()+${st.to}
          AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id=s.seller_id AND n.type=$1 AND n.reference_id=s.id::text AND n.created_at >= s.ends_at-${st.back})
        LIMIT 500`, [`SUBSCRIPTION_EXPIRING_${st.key}`])).rows;
      for (const r of rows) {
        const days = st.key === '1D' ? 'chưa đầy 1 ngày' : 'khoảng 3 ngày';
        await this.notifications.create(r.uid, `SUBSCRIPTION_EXPIRING_${st.key}`, `Gói ${r.name} sắp hết hạn`, `Gói ${r.name} của bạn sẽ hết hạn sau ${days} (${new Date(r.ends_at).toLocaleDateString('vi-VN')}). Gia hạn ngay để không bị giới hạn số tin đăng.`, 'SUBSCRIPTION', r.id).catch(() => undefined);
        sent++;
      }
    }
    const expired = (await this.db.query(`
      SELECT s.id::text, s.seller_id::text AS uid, p.name
      FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id
      WHERE s.ends_at IS NOT NULL AND s.ends_at <= NOW() AND s.ends_at > NOW()-interval '7 days' AND s.status IN ('ACTIVE','EXPIRED')
        AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id=s.seller_id AND n.type='SUBSCRIPTION_EXPIRED' AND n.reference_id=s.id::text AND n.created_at >= s.ends_at)
        AND NOT EXISTS (SELECT 1 FROM subscriptions s2 WHERE s2.seller_id=s.seller_id AND s2.id<>s.id AND s2.status='ACTIVE' AND (s2.ends_at IS NULL OR s2.ends_at>NOW()))
      LIMIT 500`)).rows;
    for (const r of expired) {
      await this.notifications.create(r.uid, 'SUBSCRIPTION_EXPIRED', `Gói ${r.name} đã hết hạn`, `Gói ${r.name} của bạn đã hết hạn. Mua lại gói để tiếp tục đăng tin không giới hạn.`, 'SUBSCRIPTION', r.id).catch(() => undefined);
      sent++;
    }
    // Gói đẩy tin
    const promos = (await this.db.query(`
      SELECT a.id::text AS aid, o.seller_id::text AS uid, pk.name, pr.title, a.ends_at
      FROM promotion_activations a JOIN promotion_orders o ON o.id=a.promotion_order_id JOIN promotion_packages pk ON pk.id=o.package_id LEFT JOIN products pr ON pr.id=o.product_id
      WHERE a.ends_at IS NOT NULL AND a.ends_at > NOW() AND a.ends_at <= NOW()+interval '1 day'
        AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id=o.seller_id AND n.type='PROMOTION_EXPIRING' AND n.reference_id=a.id::text)
      LIMIT 500`)).rows;
    for (const r of promos) {
      await this.notifications.create(r.uid, 'PROMOTION_EXPIRING', 'Gói đẩy tin sắp kết thúc', `Gói ${r.name}${r.title ? ` cho tin "${r.title}"` : ''} sẽ kết thúc trong vòng 24 giờ. Mua thêm để tin tiếp tục được ưu tiên hiển thị.`, 'SUBSCRIPTION', r.aid).catch(() => undefined);
      sent++;
    }
    if (sent) this.log.log(`Đã gửi ${sent} thông báo nhắc hết hạn gói.`);
    return sent;
  }
}
