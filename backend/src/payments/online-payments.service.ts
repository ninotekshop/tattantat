import { BadRequestException, ConflictException, ForbiddenException, Injectable, Optional, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomInt } from 'crypto';
import { NotificationsService } from '../account/notifications.service';
import { BillingService } from '../billing/billing.service';
import { DatabaseService } from '../database/database.service';
import { createGateway, PaymentGateway, WebhookResult } from './gateway/payment-gateway';
import { queueRefund } from './refund-queue';

const ok = <T>(data: T, message: string | null = null) => ({ success: true, data, message, errorCode: null });
export type EscrowSettings = { paymentExpiryMinutes: number; autoConfirmDays: number; shipDeadlineDays: number };
export const ESCROW_DEFAULTS: EscrowSettings = { paymentExpiryMinutes: 30, autoConfirmDays: 3, shipDeadlineDays: 5 };

@Injectable()
export class OnlinePaymentsService implements OnModuleInit {
  private readonly log = new Logger('OnlinePayments');
  private gw?: PaymentGateway; private gwError?: string;
  private cache?: { at: number; value: EscrowSettings };
  constructor(private readonly db: DatabaseService, private readonly notifications: NotificationsService, @Optional() private readonly billing?: BillingService) {}

  async onModuleInit() {
    try { this.gw = createGateway(); } catch (e) { this.gwError = e instanceof Error ? e.message : String(e); this.log.warn('Thanh toán online chưa sẵn sàng: ' + this.gwError); }
    try {
      await this.db.query(`CREATE TABLE IF NOT EXISTS payment_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), provider TEXT NOT NULL, event_key TEXT NOT NULL, payment_code TEXT, status TEXT, payload JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(provider, event_key))`);
      await this.db.query(`CREATE TABLE IF NOT EXISTS payment_refund_tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), payment_id UUID NOT NULL UNIQUE, order_id UUID NOT NULL, amount NUMERIC(15,2) NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', note TEXT, done_by UUID, done_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await this.db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_plan TEXT NOT NULL DEFAULT 'COD'`);
      await this.db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_percent INT`);
      await this.db.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(15,2)`);
      await this.db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`);
      await this.db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_code BIGINT`);
      await this.db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_code ON payments(provider, provider_code) WHERE provider_code IS NOT NULL`);
    } catch (e) { this.log.error('Không khởi tạo được bảng thanh toán: ' + (e instanceof Error ? e.message : String(e))); }
  }

  /** Cho web biết có bật thanh toán online không và các mức cọc. */
  options() { return ok({ online: !!this.gw, gateway: this.gw?.name ?? null, depositPercents: [10, 20, 30, 50], reason: this.gw ? null : 'Thanh toán online chưa được bật.' }); }
  get gatewayName() { return this.gw?.name ?? null; }
  async settings(fresh = false): Promise<EscrowSettings> {
    if (!fresh && this.cache && Date.now() - this.cache.at < 30_000) return this.cache.value;
    let stored: Partial<EscrowSettings> = {};
    try { stored = (await this.db.query(`SELECT value FROM app_settings WHERE key='escrow'`)).rows[0]?.value ?? {}; } catch { /* mặc định */ }
    const value = { ...ESCROW_DEFAULTS, ...stored }; this.cache = { at: Date.now(), value }; return value;
  }
  async saveSettings(adminId: string, input: Partial<EscrowSettings>) {
    const int = (v: unknown, min: number, max: number, name: string) => { const n = Number(v); if (!Number.isInteger(n) || n < min || n > max) throw new BadRequestException(`${name} phải là số nguyên từ ${min} đến ${max}.`); return n; };
    const cur = await this.settings(true);
    const value: EscrowSettings = {
      paymentExpiryMinutes: int(input.paymentExpiryMinutes ?? cur.paymentExpiryMinutes, 5, 1440, 'Thời hạn thanh toán (phút)'),
      autoConfirmDays: int(input.autoConfirmDays ?? cur.autoConfirmDays, 1, 30, 'Số ngày tự xác nhận'),
      shipDeadlineDays: int(input.shipDeadlineDays ?? cur.shipDeadlineDays, 1, 30, 'Hạn giao hàng (ngày)'),
    };
    await this.db.query(`INSERT INTO app_settings(key,value,updated_by) VALUES('escrow',$1::jsonb,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=now(), updated_by=EXCLUDED.updated_by`, [JSON.stringify(value), adminId]);
    this.cache = { at: Date.now(), value }; return value;
  }

  /** Người mua chọn thanh toán online cho đơn của mình: tạo giao dịch chờ thanh toán và trả link cổng thanh toán. */
  async createOnline(buyerId: string, orderId: string) {
    if (!this.gw) throw new BadRequestException('Thanh toán online chưa được bật. Vui lòng chọn thanh toán khi nhận hàng.');
    const s = await this.settings();
    const gw = this.gw;
    const prepared = await this.db.transaction(async c => {
      const o = (await c.query(`SELECT id, order_code, buyer_id, order_status::text AS order_status, payment_status::text AS payment_status, total_amount::text AS total, payment_plan, deposit_amount::text AS deposit FROM orders WHERE id=$1 FOR UPDATE`, [orderId])).rows[0];
      if (!o || o.buyer_id !== buyerId) throw new NotFoundException('Không tìm thấy đơn hàng của bạn');
      if (o.order_status !== 'PENDING') throw new ConflictException('Chỉ thanh toán được cho đơn đang chờ xác nhận.');
      if (o.payment_status === 'PAID') throw new ConflictException('Đơn hàng đã thanh toán.');
      // FULL: thu đủ tổng đơn. DEPOSIT: chỉ thu khoản cọc đã chốt lúc đặt hàng; phần còn lại trả khi nhận hàng.
      if (o.payment_plan === 'COD') throw new BadRequestException('Đơn này chọn thanh toán khi nhận hàng.');
      const amount = o.payment_plan === 'DEPOSIT' ? Number(o.deposit) : Number(o.total);
      if (!Number.isSafeInteger(amount) || amount < 1000) throw new BadRequestException('Số tiền đơn hàng không hợp lệ cho thanh toán online.');
      await c.query(`UPDATE payments SET status='CANCELLED', updated_at=now() WHERE order_id=$1 AND status='PENDING'`, [orderId]);
      const providerCode = Number(`${Date.now()}${randomInt(10, 99)}`);
      const p = (await c.query(`INSERT INTO payments(order_id,user_id,payment_code,provider,amount,currency,status,provider_code,expires_at) VALUES($1,$2,$3,$4,$5,'VND','PENDING',$6,now()+($7 || ' minutes')::interval) RETURNING id`, [orderId, buyerId, `${gw.name}-${providerCode}`, gw.name, amount, providerCode, String(s.paymentExpiryMinutes)])).rows[0];
      await c.query(`UPDATE orders SET payment_method='OTHER', updated_at=now() WHERE id=$1`, [orderId]);
      return { paymentId: p.id as string, providerCode, amount, orderCode: o.order_code as string };
    });
    const web = (process.env.PUBLIC_WEB_URL ?? 'http://localhost:3001').replace(/\/$/, '');
    try {
      const r = await gw.createCheckout({ providerCode: prepared.providerCode, amount: prepared.amount, description: prepared.orderCode, returnUrl: `${web}/thanh-toan/ket-qua?order=${orderId}`, cancelUrl: `${web}/thanh-toan/ket-qua?order=${orderId}&cancel=1` });
      if (r.qr) await this.db.query(`UPDATE payments SET provider_response=$2::jsonb, updated_at=now() WHERE id=$1`, [prepared.paymentId, JSON.stringify({ qr: r.qr, checkoutUrl: r.checkoutUrl })]);
      return ok({ paymentId: prepared.paymentId, checkoutUrl: r.checkoutUrl, hasQr: !!r.qr?.qrCode, orderId, expiresInMinutes: s.paymentExpiryMinutes }, 'Chuyển tới cổng thanh toán. Tiền sẽ được Tất Tần Tật giữ an toàn đến khi bạn nhận hàng.');
    } catch (e) {
      await this.db.query(`UPDATE payments SET status='FAILED', updated_at=now() WHERE id=$1`, [prepared.paymentId]);
      await this.db.query(`UPDATE orders SET payment_method='COD', updated_at=now() WHERE id=$1 AND payment_status<>'PAID'`, [orderId]);
      throw e;
    }
  }

  /** Ghi nhận kết quả thanh toán từ cổng (idempotent theo eventKey). */
  async settle(provider: string, r: WebhookResult, payload: unknown, eventKey: string) {
    const outcome = await this.db.transaction(async c => {
      const ev = await c.query(`INSERT INTO payment_events(provider,event_key,payment_code,status,payload) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT(provider,event_key) DO NOTHING RETURNING id`, [provider, eventKey, `${provider}-${r.providerCode}`, r.status, JSON.stringify(payload ?? {})]);
      if (!ev.rowCount) return { replay: true as const };
      const p = (await c.query(`SELECT p.id, p.order_id, p.amount::text AS amount, p.status::text AS status, o.seller_id, o.buyer_id, o.order_code, o.order_status::text AS order_status FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.provider=$1 AND p.provider_code=$2 FOR UPDATE OF p`, [provider, r.providerCode])).rows[0];
      if (!p) return { replay: false as const, unknown: true as const };
      if (r.status === 'FAILED') { if (p.status === 'PENDING') await c.query(`UPDATE payments SET status='FAILED', updated_at=now() WHERE id=$1`, [p.id]); return { replay: false as const }; }
      if (p.status === 'PAID') return { replay: true as const };
      if (Number(p.amount) !== r.amount) { this.log.error(`Sai số tiền: đơn ${p.order_code} cần ${p.amount}, cổng báo ${r.amount}`); throw new BadRequestException('Số tiền không khớp'); }
      if (p.status === 'CANCELLED' || p.order_status === 'CANCELLED') {
        // Tiền về sau khi đơn đã hủy/hết hạn: đưa vào hàng hoàn tiền thay vì bỏ sót.
        await c.query(`UPDATE payments SET status='PAID', transaction_id=$2, paid_at=now(), updated_at=now() WHERE id=$1`, [p.id, r.transactionId]);
        await queueRefund(c, p.order_id, 'Thanh toán đến sau khi đơn đã hủy/hết hạn');
        return { replay: false as const, late: true as const };
      }
      await c.query(`UPDATE payments SET status='PAID', transaction_id=$2, paid_at=now(), provider_response=$3::jsonb, updated_at=now() WHERE id=$1`, [p.id, r.transactionId, JSON.stringify(payload ?? {})]);
      await c.query(`UPDATE orders SET payment_status='PAID', updated_at=now() WHERE id=$1`, [p.order_id]);
      await c.query(`INSERT INTO order_status_history(order_id,status,changed_by,note) VALUES($1,$2::order_status,NULL,$3)`, [p.order_id, p.order_status, 'Đã nhận thanh toán online — tiền được giữ đến khi người mua xác nhận nhận hàng']);
      return { replay: false as const, paid: p as { seller_id: string; buyer_id: string; order_code: string; order_id: string } };
    });
    // Mã không thuộc đơn hàng nào → có thể là yêu cầu nạp ví PayOS.
    if ('unknown' in outcome && outcome.unknown && this.billing) {
      try { await this.billing.settleGatewayTopup(r); }
      catch (e) { await this.db.query(`DELETE FROM payment_events WHERE provider=$1 AND event_key=$2`, [provider, eventKey]).catch(() => undefined); throw e; }
    }
    if ('paid' in outcome && outcome.paid) {
      const p = outcome.paid;
      void this.notifications.create(p.seller_id, 'ORDER_PAID', 'Đơn hàng đã được thanh toán', `Đơn ${p.order_code} đã thanh toán trước. Tất Tần Tật đang giữ tiền — hãy xác nhận và giao hàng để nhận tiền.`, 'ORDER', p.order_id).catch(() => undefined);
      void this.notifications.create(p.buyer_id, 'ORDER_PAID', 'Thanh toán thành công', `Đơn ${p.order_code} đã thanh toán. Tiền chỉ chuyển cho người bán khi bạn xác nhận đã nhận hàng.`, 'ORDER', p.order_id).catch(() => undefined);
    }
    return outcome;
  }

  async handleWebhook(provider: string, body: Record<string, unknown>) {
    if (!this.gw || this.gw.name.toLowerCase() !== provider.toLowerCase()) throw new NotFoundException();
    const parsed = this.gw.parseWebhook(body);
    if (!parsed) throw new ForbiddenException('Chữ ký không hợp lệ');
    const key = `${parsed.providerCode}:${parsed.status}:${parsed.transactionId}`;
    await this.settle(this.gw.name, parsed, body, key);
    return { success: true };
  }

  /** Chỉ dùng khi PAYMENT_GATEWAY=mock và không chạy production: mô phỏng cổng báo thanh toán thành công. */
  async mockPay(buyerId: string, providerCode: number) {
    if (this.gw?.name !== 'MOCK' || process.env.NODE_ENV === 'production') throw new NotFoundException();
    const p = (await this.db.query(`SELECT user_id, amount::text AS amount FROM payments WHERE provider='MOCK' AND provider_code=$1`, [providerCode])).rows[0];
    if (!p || p.user_id !== buyerId) throw new NotFoundException('Không tìm thấy giao dịch');
    await this.settle('MOCK', { providerCode: String(providerCode), status: 'PAID', transactionId: `MOCK-TX-${providerCode}`, amount: Number(p.amount) }, { mock: true }, `${providerCode}:PAID`);
    return ok({ paid: true }, 'Đã thanh toán (thử nghiệm).');
  }

  /** Thông tin mã QR của giao dịch đang chờ thanh toán (người mua của đơn). */
  async qrInfo(uid: string, orderId: string) {
    const r = (await this.db.query(`SELECT p.provider_code::text AS code, p.amount::text AS amount, p.status::text AS status, p.expires_at, p.provider_response, o.order_code, o.payment_status::text AS payment_status FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.id=$1 AND o.buyer_id=$2 AND p.provider<>'COD' ORDER BY p.created_at DESC LIMIT 1`, [orderId, uid])).rows[0];
    if (!r) throw new NotFoundException('Chưa có giao dịch thanh toán cho đơn này.');
    const qr = r.provider_response?.qr ?? null;
    return ok({ orderCode: r.order_code, amount: r.amount, status: r.status, paymentStatus: r.payment_status, expiresAt: r.expires_at, qrCode: qr?.qrCode ?? null, bin: qr?.bin ?? null, accountNumber: qr?.accountNumber ?? null, accountName: qr?.accountName ?? null, description: qr?.description ?? null, checkoutUrl: r.provider_response?.checkoutUrl ?? null });
  }

  /** Hỏi cổng trạng thái giao dịch mới nhất của đơn và ghi nhận nếu đã thanh toán (khi webhook chưa tới). */
  async syncOnline(uid: string, orderId: string) {
    const r = (await this.db.query(`SELECT p.provider, p.provider_code::text AS code, p.status::text AS status FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.id=$1 AND o.buyer_id=$2 AND p.provider<>'COD' ORDER BY p.created_at DESC LIMIT 1`, [orderId, uid])).rows[0];
    if (!r) throw new NotFoundException('Không tìm thấy giao dịch.');
    if (r.status === 'PENDING' && this.gw?.getStatus && this.gw.name === r.provider) {
      const res = await this.gw.getStatus(Number(r.code)).catch(() => null);
      if (res?.status === 'PAID') await this.settle(this.gw.name, res, { polled: true }, `${res.providerCode}:PAID:${res.transactionId}`);
    }
    return this.orderPayment(uid, orderId);
  }

  async orderPayment(uid: string, orderId: string) {
    const r = (await this.db.query(`SELECT o.order_code, (SELECT oi.product_name FROM order_items oi WHERE oi.order_id=o.id LIMIT 1) AS product_name, o.payment_status::text AS payment_status, o.payment_plan, o.deposit_amount::text AS deposit_amount, o.total_amount::text AS total_amount, o.order_status::text AS order_status, o.buyer_id, o.seller_id, (SELECT p.status::text FROM payments p WHERE p.order_id=o.id ORDER BY p.created_at DESC LIMIT 1) AS last_payment, (SELECT p.expires_at FROM payments p WHERE p.order_id=o.id ORDER BY p.created_at DESC LIMIT 1) AS expires_at FROM orders o WHERE o.id=$1`, [orderId])).rows[0];
    if (!r || (r.buyer_id !== uid && r.seller_id !== uid)) throw new NotFoundException('Không tìm thấy đơn hàng');
    return ok({ orderCode: r.order_code, productName: r.product_name, paymentPlan: r.payment_plan, depositAmount: r.deposit_amount, totalAmount: r.total_amount, paymentStatus: r.payment_status, orderStatus: r.order_status, lastPayment: r.last_payment, expiresAt: r.expires_at });
  }

  /** Người mua xác nhận đã nhận hàng → giải ngân cho người bán. */
  async sellerOf(orderId: string) { return (await this.db.query(`SELECT seller_id, buyer_id, order_status::text AS order_status, payment_method::text AS payment_method FROM orders WHERE id=$1`, [orderId])).rows[0] as { seller_id: string; buyer_id: string; order_status: string; payment_method: string } | undefined; }

  // ---------- Admin ----------
  async adminList(status: string, q: string, page: number) {
    const p = Math.max(1, page || 1);
    const rows = (await this.db.query(`SELECT p.id, p.payment_code, p.provider, p.amount::text AS amount, p.status::text AS status, p.transaction_id, p.paid_at, p.created_at, o.order_code, o.order_status::text AS order_status, ub.full_name AS buyer_name, us.full_name AS seller_name
      FROM payments p JOIN orders o ON o.id=p.order_id JOIN users ub ON ub.id=o.buyer_id JOIN users us ON us.id=o.seller_id
      WHERE p.provider<>'COD' AND ($1::text='' OR p.status::text=$1) AND ($2::text='' OR o.order_code ILIKE '%'||$2||'%' OR p.payment_code ILIKE '%'||$2||'%' OR p.transaction_id ILIKE '%'||$2||'%')
      ORDER BY p.created_at DESC LIMIT 30 OFFSET $3`, [status, q.trim(), (p - 1) * 30])).rows;
    const stats = (await this.db.query(`SELECT COALESCE(SUM(amount) FILTER (WHERE status='PAID' AND o.order_status NOT IN ('COMPLETED','CANCELLED')),0)::text AS held, COALESCE(SUM(amount) FILTER (WHERE status='PAID'),0)::text AS paid_total, COUNT(*) FILTER (WHERE status='PENDING' AND expires_at > now())::int AS pending, (SELECT COUNT(*)::int FROM payment_refund_tasks WHERE status='PENDING') AS refunds FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.provider<>'COD'`)).rows[0];
    return ok({ items: rows, stats, gateway: this.gatewayName, gatewayError: this.gwError ?? null });
  }
  async reconcile() {
    const q = async (sql: string) => (await this.db.query(sql)).rows;
    const [paidNotOrder, orderNotPaid, stalePending, doneNoTask, refunds] = await Promise.all([
      q(`SELECT o.order_code, p.payment_code, p.amount::text AS amount FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.provider<>'COD' AND p.status='PAID' AND o.payment_status::text NOT IN ('PAID','PROCESSING','REFUNDED','PARTIALLY_REFUNDED') LIMIT 100`),
      q(`SELECT o.order_code, o.payment_status::text AS payment_status FROM orders o WHERE o.payment_method::text<>'COD' AND o.payment_status='PAID' AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id=o.id AND p.status='PAID') LIMIT 100`),
      q(`SELECT o.order_code, p.payment_code, p.expires_at FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.provider<>'COD' AND p.status='PENDING' AND p.expires_at < now()-interval '10 minutes' LIMIT 100`),
      q(`SELECT o.order_code, p.payment_code FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.provider<>'COD' AND p.status='PAID' AND o.order_status='CANCELLED' AND NOT EXISTS (SELECT 1 FROM payment_refund_tasks t WHERE t.payment_id=p.id) LIMIT 100`),
      q(`SELECT t.id, o.order_code, t.amount::text AS amount FROM payment_refund_tasks t JOIN orders o ON o.id=t.order_id WHERE t.status='PENDING' AND t.created_at < now()-interval '2 days' LIMIT 100`),
    ]);
    const items = [
      ...paidNotOrder.map(r => ({ type: 'PAID_ORDER_MISMATCH', severity: 'HIGH', text: `Giao dịch ${r.payment_code} đã thu ${r.amount} đ nhưng đơn ${r.order_code} chưa ghi nhận thanh toán` })),
      ...orderNotPaid.map(r => ({ type: 'ORDER_WITHOUT_PAYMENT', severity: 'HIGH', text: `Đơn ${r.order_code} ghi đã thanh toán nhưng không có giao dịch thu tiền` })),
      ...doneNoTask.map(r => ({ type: 'CANCELLED_WITHOUT_REFUND', severity: 'HIGH', text: `Đơn ${r.order_code} đã hủy, giao dịch ${r.payment_code} đã thu tiền nhưng chưa có yêu cầu hoàn` })),
      ...refunds.map(r => ({ type: 'REFUND_OVERDUE', severity: 'MEDIUM', text: `Yêu cầu hoàn ${r.amount} đ cho đơn ${r.order_code} tồn đọng quá 2 ngày` })),
      ...stalePending.map(r => ({ type: 'STALE_PENDING', severity: 'LOW', text: `Giao dịch ${r.payment_code} (đơn ${r.order_code}) quá hạn mà chưa được đóng` })),
    ];
    return ok({ checkedAt: new Date().toISOString(), items });
  }
  async refundTasks(status: string) {
    const rows = (await this.db.query(`SELECT t.id, t.amount::text AS amount, t.reason, t.status, t.note, t.created_at, t.done_at, o.order_code, ub.full_name AS buyer_name, ub.phone AS buyer_phone, ub.email AS buyer_email, p.provider, p.transaction_id
      FROM payment_refund_tasks t JOIN orders o ON o.id=t.order_id JOIN users ub ON ub.id=o.buyer_id JOIN payments p ON p.id=t.payment_id WHERE ($1::text='' OR t.status=$1) ORDER BY t.created_at DESC LIMIT 100`, [status])).rows;
    return ok(rows);
  }
  async completeRefund(adminId: string, id: string, note: string) {
    if (String(note ?? '').trim().length < 3) throw new BadRequestException('Vui lòng ghi mã giao dịch hoàn tiền / ghi chú.');
    const t = await this.db.transaction(async c => {
      const t = (await c.query(`SELECT id, payment_id, order_id FROM payment_refund_tasks WHERE id=$1 AND status='PENDING' FOR UPDATE`, [id])).rows[0];
      if (!t) throw new BadRequestException('Yêu cầu không còn ở trạng thái chờ hoàn.');
      await c.query(`UPDATE payment_refund_tasks SET status='DONE', note=$2, done_by=$3, done_at=now() WHERE id=$1`, [id, note.trim(), adminId]);
      await c.query(`UPDATE payments SET status='REFUNDED', updated_at=now() WHERE id=$1`, [t.payment_id]);
      await c.query(`UPDATE orders SET payment_status='REFUNDED', updated_at=now() WHERE id=$1`, [t.order_id]);
      return { ...t, buyer: (await c.query(`SELECT buyer_id, order_code FROM orders WHERE id=$1`, [t.order_id])).rows[0] };
    });
    void this.notifications.create(t.buyer.buyer_id, 'ORDER_REFUNDED', 'Đã hoàn tiền', `Đơn ${t.buyer.order_code} đã được hoàn tiền về phương thức bạn đã thanh toán.`, 'ORDER', t.order_id).catch(() => undefined);
    return ok({ id }, 'Đã đánh dấu hoàn tiền.');
  }
}
