import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from '../account/notifications.service';
import { DatabaseService } from '../database/database.service';
import { LedgerService } from '../finance/ledger.service';
import { OnlinePaymentsService } from './online-payments.service';
import { queueRefund } from './refund-queue';

/** Tác vụ nền cho thanh toán đảm bảo: đóng giao dịch quá hạn, tự xác nhận nhận hàng, tự hoàn tiền khi người bán không giao. */
@Injectable()
export class EscrowService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Escrow');
  private timer?: NodeJS.Timeout;
  constructor(private readonly db: DatabaseService, private readonly payments: OnlinePaymentsService, private readonly ledger: LedgerService, private readonly notifications: NotificationsService) {}

  onModuleInit() {
    if (process.env.ESCROW_JOBS === 'false') return;
    const configured = Number(process.env.ESCROW_INTERVAL_MS ?? 300_000);
    const interval = Number.isSafeInteger(configured) ? Math.max(configured, 30_000) : 300_000;
    setTimeout(() => void this.runSafely(), 60_000).unref();
    this.timer = setInterval(() => void this.runSafely(), interval); this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  private async runSafely() { try { await this.run(); } catch (e) { this.log.warn('Tác vụ escrow lỗi: ' + (e instanceof Error ? e.message : String(e))); } }

  async run() {
    const locked = await this.db.transaction(async c => (await c.query(`SELECT pg_try_advisory_xact_lock(hashtext('escrow-jobs')) AS ok`)).rows[0].ok as boolean);
    if (!locked) return { expired: 0, confirmed: 0, refunded: 0 };
    const s = await this.payments.settings(true);
    return { expired: await this.expireUnpaid(), confirmed: await this.autoConfirm(s.autoConfirmDays), refunded: await this.autoRefundUnshipped(s.shipDeadlineDays) };
  }

  /** Giao dịch online quá hạn: đóng giao dịch, hủy đơn chưa xác nhận và mở lại tin đăng. */
  async expireUnpaid(): Promise<number> {
    const rows = (await this.db.query(`SELECT p.id::text, p.order_id::text FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.provider<>'COD' AND p.status='PENDING' AND p.expires_at < now() AND o.order_status='PENDING' LIMIT 200`)).rows;
    let n = 0;
    for (const r of rows) {
      const done = await this.db.transaction(async c => {
        const p = (await c.query(`UPDATE payments SET status='CANCELLED', updated_at=now() WHERE id=$1 AND status='PENDING' RETURNING id`, [r.id])).rows[0]; if (!p) return null;
        const o = (await c.query(`UPDATE orders SET order_status='CANCELLED', updated_at=now() WHERE id=$1 AND order_status='PENDING' AND payment_status<>'PAID' RETURNING buyer_id, seller_id, product_id, order_code`, [r.order_id])).rows[0]; if (!o) return null;
        await c.query(`UPDATE products SET status='ACTIVE', updated_at=now() WHERE id=$1 AND status='RESERVED'`, [o.product_id]);
        await c.query(`INSERT INTO order_status_history(order_id,status,changed_by,note) VALUES($1,'CANCELLED',NULL,'Quá hạn thanh toán online')`, [r.order_id]);
        return o;
      });
      if (done) { n++; void this.notifications.create(done.buyer_id, 'ORDER_STATUS', 'Đơn hàng đã hủy', `Đơn ${done.order_code} đã bị hủy do quá hạn thanh toán online.`, 'ORDER', r.order_id).catch(() => undefined); }
    }
    return n;
  }

  /** Đơn online đã giao quá N ngày mà người mua không xác nhận/khiếu nại → tự tất toán cho người bán. */
  async autoConfirm(days: number): Promise<number> {
    const rows = (await this.db.query(`SELECT id::text, seller_id::text, buyer_id::text, order_code FROM orders WHERE order_status='DELIVERED' AND payment_method::text<>'COD' AND payment_status='PAID' AND updated_at < now() - ($1 || ' days')::interval ORDER BY updated_at LIMIT 100`, [String(days)])).rows;
    let n = 0;
    for (const r of rows) {
      try {
        await this.ledger.completeOrder(r.id, r.seller_id);
        await this.db.query(`INSERT INTO order_status_history(order_id,status,changed_by,note) VALUES($1,'COMPLETED',NULL,$2)`, [r.id, `Tự động xác nhận sau ${days} ngày không có khiếu nại`]);
        n++;
        void this.notifications.create(r.seller_id, 'ORDER_COMPLETED', 'Đơn hàng đã tất toán', `Đơn ${r.order_code} tự động hoàn tất; tiền đã được ghi vào ví của bạn.`, 'ORDER', r.id).catch(() => undefined);
        void this.notifications.create(r.buyer_id, 'ORDER_COMPLETED', 'Đơn hàng tự động hoàn tất', `Đơn ${r.order_code} đã được tự động xác nhận sau ${days} ngày. Nếu có vấn đề, hãy gửi khiếu nại.`, 'ORDER', r.id).catch(() => undefined);
      } catch (e) { this.log.warn(`Không tự xác nhận được đơn ${r.order_code}: ${e instanceof Error ? e.message : e}`); }
    }
    return n;
  }

  /** Đơn đã thanh toán nhưng người bán không giao trong hạn → hủy và hoàn tiền cho người mua. */
  async autoRefundUnshipped(days: number): Promise<number> {
    const rows = (await this.db.query(`SELECT o.id::text FROM orders o JOIN payments p ON p.order_id=o.id AND p.status='PAID' AND p.provider<>'COD' WHERE o.order_status IN ('PENDING','CONFIRMED','PREPARING') AND p.paid_at < now() - ($1 || ' days')::interval LIMIT 100`, [String(days)])).rows;
    let n = 0;
    for (const r of rows) {
      const o = await this.db.transaction(async c => {
        const o = (await c.query(`UPDATE orders SET order_status='CANCELLED', updated_at=now() WHERE id=$1 AND order_status IN ('PENDING','CONFIRMED','PREPARING') RETURNING buyer_id, seller_id, product_id, order_code`, [r.id])).rows[0]; if (!o) return null;
        await c.query(`UPDATE products SET status='ACTIVE', updated_at=now() WHERE id=$1 AND status='RESERVED'`, [o.product_id]);
        await queueRefund(c, r.id, `Người bán không giao hàng trong ${days} ngày`);
        await c.query(`INSERT INTO order_status_history(order_id,status,changed_by,note) VALUES($1,'CANCELLED',NULL,$2)`, [r.id, `Tự động hủy và hoàn tiền: người bán không giao trong ${days} ngày`]);
        return o;
      });
      if (o) { n++; void this.notifications.create(o.buyer_id, 'ORDER_REFUNDED', 'Đơn hàng bị hủy, sẽ hoàn tiền', `Đơn ${o.order_code} bị hủy do người bán không giao trong ${days} ngày. Tiền sẽ được hoàn lại cho bạn.`, 'ORDER', r.id).catch(() => undefined); void this.notifications.create(o.seller_id, 'ORDER_STATUS', 'Đơn hàng bị tự động hủy', `Đơn ${o.order_code} bị hủy vì quá hạn giao hàng.`, 'ORDER', r.id).catch(() => undefined); }
    }
    return n;
  }
}
