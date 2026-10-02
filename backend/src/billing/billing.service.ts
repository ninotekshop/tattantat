import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { randomBytes, randomInt } from 'node:crypto';
import { createGateway, PaymentGateway, WebhookResult } from '../payments/gateway/payment-gateway';
import type { PoolClient } from 'pg';
import { NotificationsService } from '../account/notifications.service';
import { DatabaseService } from '../database/database.service';
import { IdempotencyService } from '../finance/idempotency.service';
import { LedgerWriterService } from '../finance/ledger-writer.service';

const envelope = <T>(data: T, message: string | null = null) => ({ success: true, data, message, errorCode: null });
export const MIN_TOPUP = 10_000;
export const MAX_TOPUP = 50_000_000;
const TOPUP_TTL_HOURS = 72;
const MAX_PENDING_TOPUPS = 3;

const BANK_NAMES: Record<string, string> = { '970436': 'Vietcombank', '970415': 'VietinBank', '970418': 'BIDV', '970405': 'Agribank', '970422': 'MB Bank', '970407': 'Techcombank', '970416': 'ACB', '970432': 'VPBank', '970423': 'TPBank', '970403': 'Sacombank', '970437': 'HDBank', '970441': 'VIB', '970448': 'OCB', '970443': 'SHB', '970426': 'MSB', '970431': 'Eximbank', '970454': 'Viet Capital Bank', '970429': 'SCB' };
export type BankSettings = { bankBin: string; bankName: string; accountNumber: string; accountName: string };
type PlanVersion = { id: string; name: string; version_id: string; price: string; billing_cycle: 'MONTHLY' | 'YEARLY'; max_listings: number | null; features: unknown };
class Insufficient extends BadRequestException {
  constructor(missing: bigint) { super({ success: false, message: `Số dư không đủ. Bạn cần nạp thêm ${missing.toLocaleString('vi-VN')} đ.`, errorCode: 'INSUFFICIENT_BALANCE', data: { missing: missing.toString() } }); }
}

/** Ví trả trước, nạp tiền QR/chuyển khoản (admin xác nhận) và mua gói đăng tin / đẩy tin bằng số dư. */
@Injectable()
export class BillingService implements OnModuleInit {
  private readonly log = new Logger('Billing');
  private gw?: PaymentGateway;
  constructor(private readonly db: DatabaseService, private readonly idempotency: IdempotencyService, private readonly ledger: LedgerWriterService, private readonly notifications: NotificationsService) {}

  private notify(userId: string, type: string, title: string, content: string, refType?: string, refId?: string) {
    void this.notifications.create(userId, type, title, content, refType, refId).catch(() => undefined);
  }

  async onModuleInit() {
    try { const g = createGateway(); if (g.name === 'PAYOS') this.gw = g; } catch { /* không có PayOS: nạp ví theo chuyển khoản thủ công */ }
    try {
      await this.db.query(`CREATE TABLE IF NOT EXISTS credit_accounts (user_id UUID PRIMARY KEY REFERENCES users(id), balance BIGINT NOT NULL DEFAULT 0 CHECK(balance>=0), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await this.db.query(`CREATE TABLE IF NOT EXISTS credit_transactions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), type TEXT NOT NULL, amount BIGINT NOT NULL, balance_after BIGINT NOT NULL, ref_type TEXT, ref_id TEXT, note TEXT, created_by UUID, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS credit_transactions_user_idx ON credit_transactions(user_id, created_at DESC)`);
      await this.db.query(`CREATE TABLE IF NOT EXISTS topup_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), amount BIGINT NOT NULL CHECK(amount>0), code TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'PENDING', received_amount BIGINT, bank_snapshot JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ NOT NULL, decided_by UUID, decided_at TIMESTAMPTZ, reject_reason TEXT)`);
      await this.db.query(`ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'MANUAL'`);
      await this.db.query(`ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS provider_code BIGINT`);
      await this.db.query(`ALTER TABLE topup_requests ADD COLUMN IF NOT EXISTS checkout_url TEXT`);
      await this.db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_topup_provider_code ON topup_requests(provider, provider_code) WHERE provider_code IS NOT NULL`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS topup_requests_status_idx ON topup_requests(status, created_at DESC)`);
      await this.db.query(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_by UUID)`);
      // Chuẩn hóa tên hiển thị các gói bán hàng (Free/Pro/Business/Enterprise kèm tên tiếng Việt).
      await this.db.query(`UPDATE subscription_plans SET name = CASE
          WHEN lower(btrim(name)) IN ('free','gói free','gói miễn phí','miễn phí') THEN 'Free (Miễn phí)'
          WHEN lower(btrim(name)) IN ('pro','gói pro') THEN 'Pro (Chuyên nghiệp)'
          WHEN lower(btrim(name)) IN ('business','gói business') THEN 'Business (Kinh doanh)'
          WHEN lower(btrim(name)) IN ('enterprise','gói enterprise') THEN 'Enterprise (Cao cấp)'
          ELSE name END
        WHERE lower(btrim(name)) IN ('free','gói free','gói miễn phí','miễn phí','pro','gói pro','business','gói business','enterprise','gói enterprise')`);
    } catch (error) { this.log.error('Không khởi tạo được bảng thanh toán: ' + (error instanceof Error ? error.message : String(error))); }
  }

  // ---------- cấu hình ngân hàng ----------
  async bank(): Promise<BankSettings | null> {
    const row = (await this.db.query(`SELECT value FROM app_settings WHERE key='bank_transfer'`)).rows[0];
    const value = row?.value as BankSettings | undefined;
    return value?.bankBin && value.accountNumber ? value : null;
  }
  async saveBank(actorId: string, input: BankSettings) {
    const bankBin = String(input.bankBin ?? '').trim(); const accountNumber = String(input.accountNumber ?? '').replace(/\s/g, '');
    const accountName = String(input.accountName ?? '').trim().toUpperCase(); const bankName = String(input.bankName ?? '').trim();
    if (!/^\d{6}$/.test(bankBin)) throw new BadRequestException('Mã BIN ngân hàng gồm 6 chữ số (ví dụ Vietcombank 970436).');
    if (!/^\d{6,20}$/.test(accountNumber)) throw new BadRequestException('Số tài khoản gồm 6–20 chữ số.');
    if (!accountName || accountName.length > 60 || !bankName || bankName.length > 60) throw new BadRequestException('Tên ngân hàng / chủ tài khoản không hợp lệ.');
    await this.db.query(`INSERT INTO app_settings(key,value,updated_by) VALUES('bank_transfer',$1::jsonb,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=now(), updated_by=EXCLUDED.updated_by`, [JSON.stringify({ bankBin, bankName, accountNumber, accountName }), actorId]);
    return envelope({ bankBin, bankName, accountNumber, accountName }, 'Đã lưu tài khoản nhận tiền.');
  }
  private qrUrl(bank: BankSettings, amount: string | number, code: string) {
    return `https://img.vietqr.io/image/${bank.bankBin}-${bank.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(code)}&accountName=${encodeURIComponent(bank.accountName)}`;
  }

  // ---------- tổng quan khách hàng ----------
  async overview(userId: string) {
    const balance = (await this.db.query('SELECT balance::text FROM credit_accounts WHERE user_id=$1', [userId])).rows[0]?.balance ?? '0';
    const sub = (await this.db.query(`SELECT s.id, p.code, p.name, s.starts_at AS "startsAt", s.ends_at AS "endsAt", s.max_listings_snapshot AS "maxListings", s.features_snapshot AS features, s.billing_cycle_snapshot AS "billingCycle", s.price_snapshot::text AS price
      FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id WHERE s.seller_id=$1 AND s.status='ACTIVE' AND (s.ends_at IS NULL OR s.ends_at>NOW()) ORDER BY s.created_at DESC LIMIT 1`, [userId])).rows[0] ?? null;
    const used = Number((await this.db.query(`SELECT count(*)::int AS n FROM products WHERE seller_id=$1 AND status IN ('DRAFT','PENDING_REVIEW','ACTIVE','RESERVED') AND deleted_at IS NULL`, [userId])).rows[0].n);
    const history = (await this.db.query(`SELECT s.id, p.name, s.status, s.price_snapshot::text AS price, s.starts_at AS "startsAt", s.ends_at AS "endsAt", s.created_at AS "createdAt" FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id WHERE s.seller_id=$1 ORDER BY s.created_at DESC LIMIT 20`, [userId])).rows;
    const promotions = (await this.db.query(`SELECT o.id, pk.name, o.status::text AS status, o.package_price_snapshot::text AS price, o.promotion_type_snapshot::text AS type, o.created_at AS "createdAt", pr.title AS "productTitle", a.ends_at AS "endsAt"
      FROM promotion_orders o JOIN promotion_packages pk ON pk.id=o.package_id LEFT JOIN products pr ON pr.id=o.product_id LEFT JOIN promotion_activations a ON a.promotion_order_id=o.id
      WHERE o.seller_id=$1 ORDER BY o.created_at DESC LIMIT 20`, [userId])).rows;
    const limit = sub ? sub.maxListings : 10;
    return envelope({ balance, subscription: sub, listing: { used, limit }, history, promotions });
  }

  // ---------- nạp tiền ----------
  async createTopup(userId: string, amountInput: number) {
    const amount = Number(amountInput);
    if (!Number.isInteger(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) throw new BadRequestException(`Số tiền nạp từ ${MIN_TOPUP.toLocaleString('vi-VN')} đ đến ${MAX_TOPUP.toLocaleString('vi-VN')} đ.`);
    // Có PayOS: tạo QR PayOS, tiền tự cộng vào ví khi thanh toán xong. Lỗi PayOS → quay về chuyển khoản thủ công nếu đã cấu hình ngân hàng.
    if (this.gw) {
      try { return await this.createPayosTopup(userId, amount); }
      catch (e) { if (!(await this.bank())) throw e; this.log.warn('PayOS lỗi, chuyển sang nạp thủ công: ' + (e instanceof Error ? e.message : String(e))); }
    }
    const bank = await this.bank();
    if (!bank) throw new BadRequestException('Chưa tạo được mã nạp tiền vì hệ thống chưa có tài khoản ngân hàng nhận tiền. Quản trị viên cần cấu hình tại: Admin → Khách hàng mua Gói → Tài khoản nhận tiền.');
    return this.db.transaction(async client => {
      await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]);
      await client.query(`UPDATE topup_requests SET status='EXPIRED' WHERE user_id=$1 AND status='PENDING' AND expires_at<now()`, [userId]);
      const pending = Number((await client.query(`SELECT count(*)::int AS n FROM topup_requests WHERE user_id=$1 AND status='PENDING'`, [userId])).rows[0].n);
      if (pending >= MAX_PENDING_TOPUPS) throw new BadRequestException('Bạn đang có quá nhiều yêu cầu nạp chờ xác nhận. Hãy hủy bớt hoặc chờ quản trị viên duyệt.');
      const code = 'TTT' + randomBytes(5).toString('hex').toUpperCase().slice(0, 7);
      const row = (await client.query(`INSERT INTO topup_requests(user_id,amount,code,bank_snapshot,expires_at) VALUES($1,$2,$3,$4::jsonb,now()+($5||' hours')::interval) RETURNING id, code, amount::text, status, created_at AS "createdAt", expires_at AS "expiresAt"`, [userId, amount, code, JSON.stringify(bank), String(TOPUP_TTL_HOURS)])).rows[0];
      return envelope({ ...row, bank, qrUrl: this.qrUrl(bank, amount, code) }, 'Đã tạo yêu cầu nạp tiền. Hãy chuyển khoản đúng số tiền và nội dung.');
    });
  }
  private async createPayosTopup(userId: string, amount: number) {
    const gw = this.gw!;
    const code = 'TTT' + randomBytes(5).toString('hex').toUpperCase().slice(0, 7);
    const providerCode = Number(`${Date.now()}${randomInt(10, 99)}`);
    const row = await this.db.transaction(async client => {
      await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]);
      await client.query(`UPDATE topup_requests SET status='EXPIRED' WHERE user_id=$1 AND status='PENDING' AND expires_at<now()`, [userId]);
      const pending = Number((await client.query(`SELECT count(*)::int AS n FROM topup_requests WHERE user_id=$1 AND status='PENDING'`, [userId])).rows[0].n);
      if (pending >= MAX_PENDING_TOPUPS) throw new BadRequestException('Bạn đang có quá nhiều yêu cầu nạp chờ thanh toán. Hãy hủy bớt hoặc hoàn tất các yêu cầu cũ.');
      return (await client.query(`INSERT INTO topup_requests(user_id,amount,code,expires_at,provider,provider_code) VALUES($1,$2,$3,now()+interval '2 hours','PAYOS',$4) RETURNING id, code, amount::text, status, created_at AS "createdAt", expires_at AS "expiresAt"`, [userId, amount, code, providerCode])).rows[0];
    });
    try {
      const web = (process.env.PUBLIC_WEB_URL ?? 'http://localhost:3001').replace(/\/$/, '');
      const r = await gw.createCheckout({ providerCode, amount, description: code, returnUrl: `${web}/vi-tien`, cancelUrl: `${web}/vi-tien` });
      const q = r.qr;
      const bank: BankSettings | null = q?.accountNumber && q.bin ? { bankBin: q.bin, bankName: BANK_NAMES[q.bin] ?? `Ngân hàng (BIN ${q.bin})`, accountNumber: q.accountNumber, accountName: q.accountName ?? '' } : null;
      await this.db.query(`UPDATE topup_requests SET bank_snapshot=$2::jsonb, checkout_url=$3 WHERE id=$1`, [row.id, bank ? JSON.stringify(bank) : null, r.checkoutUrl]);
      return envelope({ ...row, provider: 'PAYOS', bank, qrUrl: bank ? this.qrUrl(bank, amount, code) : null, checkoutUrl: r.checkoutUrl }, 'Đã tạo mã nạp tiền. Quét mã QR để thanh toán — tiền sẽ tự động cộng vào ví.');
    } catch (e) {
      await this.db.query(`UPDATE topup_requests SET status='CANCELLED', decided_at=now() WHERE id=$1`, [row.id]).catch(() => undefined);
      throw e;
    }
  }

  /** Ghi nhận kết quả thanh toán PayOS cho yêu cầu nạp ví (webhook hoặc hỏi lại cổng). Trả true nếu mã thuộc về một yêu cầu nạp ví. */
  async settleGatewayTopup(r: WebhookResult): Promise<boolean> {
    return this.db.transaction(async client => {
      const t = (await client.query(`SELECT id,user_id,amount::text,code,status FROM topup_requests WHERE provider='PAYOS' AND provider_code=$1 FOR UPDATE`, [r.providerCode])).rows[0];
      if (!t) return false;
      if (r.status === 'FAILED') { if (t.status === 'PENDING') await client.query(`UPDATE topup_requests SET status='CANCELLED', decided_at=now() WHERE id=$1`, [t.id]); return true; }
      if (t.status === 'CONFIRMED') return true;
      const amount = BigInt(Math.trunc(Number(r.amount)));
      if (amount <= 0n) return true;
      if (amount !== BigInt(t.amount)) this.log.warn(`Nạp ${t.code}: yêu cầu ${t.amount}, cổng báo ${amount}. Cộng theo số tiền thực nhận.`);
      await this.move(client, t.user_id, amount, 'TOPUP', 'TOPUP_REQUEST', t.id, `Nạp tiền ${t.code} (PayOS)`);
      await client.query(`UPDATE topup_requests SET status='CONFIRMED', received_amount=$2, decided_at=now() WHERE id=$1`, [t.id, amount.toString()]);
      this.notify(t.user_id, 'TOPUP_CONFIRMED', 'Nạp tiền thành công', `Ví của bạn vừa được cộng ${amount.toLocaleString('vi-VN')} đ (mã ${t.code}).`, 'TOPUP', t.id);
      return true;
    });
  }

  /** Hỏi PayOS trạng thái yêu cầu nạp (khi webhook chưa tới, ví dụ chạy localhost). */
  async syncTopup(userId: string, id: string) {
    const t = (await this.db.query(`SELECT id, status, provider, provider_code::text AS code FROM topup_requests WHERE id=$1 AND user_id=$2`, [id, userId])).rows[0];
    if (!t) throw new NotFoundException('Không tìm thấy yêu cầu nạp.');
    if (['PENDING', 'EXPIRED'].includes(t.status) && t.provider === 'PAYOS' && this.gw?.getStatus) {
      const res = await this.gw.getStatus(Number(t.code)).catch(() => null);
      if (res) await this.settleGatewayTopup(res);
    }
    const status = (await this.db.query(`SELECT status FROM topup_requests WHERE id=$1`, [id])).rows[0].status;
    return envelope({ id, status });
  }

  async myTopups(userId: string) {
    const rows = (await this.db.query(`SELECT id, code, amount::text, status, provider, checkout_url AS "checkoutUrl", received_amount::text AS "receivedAmount", created_at AS "createdAt", expires_at AS "expiresAt", reject_reason AS "rejectReason", bank_snapshot AS bank FROM topup_requests WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`, [userId])).rows;
    return envelope(rows.map(r => ({ ...r, status: r.status === 'PENDING' && new Date(r.expiresAt) < new Date() ? 'EXPIRED' : r.status, qrUrl: r.status === 'PENDING' && r.bank ? this.qrUrl(r.bank, r.amount, r.code) : null })));
  }
  async cancelTopup(userId: string, id: string) {
    const r = await this.db.query(`UPDATE topup_requests SET status='CANCELLED', decided_at=now() WHERE id=$1 AND user_id=$2 AND status='PENDING'`, [id, userId]);
    if (!r.rowCount) throw new NotFoundException('Không tìm thấy yêu cầu nạp đang chờ.');
    return envelope({ id }, 'Đã hủy yêu cầu nạp tiền.');
  }
  async transactions(userId: string) {
    return envelope((await this.db.query(`SELECT id, type, amount::text, balance_after::text AS "balanceAfter", note, created_at AS "createdAt" FROM credit_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`, [userId])).rows);
  }

  // ---------- ví ----------
  private async lockAccount(client: PoolClient, userId: string): Promise<bigint> {
    await client.query('INSERT INTO credit_accounts(user_id) VALUES($1) ON CONFLICT DO NOTHING', [userId]);
    return BigInt((await client.query('SELECT balance::text FROM credit_accounts WHERE user_id=$1 FOR UPDATE', [userId])).rows[0].balance);
  }
  private async move(client: PoolClient, userId: string, delta: bigint, type: string, refType: string | null, refId: string | null, note: string, actor?: string) {
    const current = await this.lockAccount(client, userId);
    const next = current + delta;
    if (next < 0n) throw new Insufficient(-next);
    await client.query('UPDATE credit_accounts SET balance=$2, updated_at=now() WHERE user_id=$1', [userId, next.toString()]);
    await client.query('INSERT INTO credit_transactions(user_id,type,amount,balance_after,ref_type,ref_id,note,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [userId, type, delta.toString(), next.toString(), refType, refId, note, actor ?? null]);
    return next;
  }

  // ---------- mua gói đăng tin ----------
  async buyPlan(userId: string, planId: string, key: string | undefined) {
    if (!/^[0-9a-f-]{36}$/i.test(String(planId))) throw new BadRequestException('Gói không hợp lệ.');
    return this.db.transaction(async client => {
      const claim = await this.idempotency.claim(client, 'billing-plan', userId, key, { planId });
      if (claim.replay) return claim.replay;
      const plan = (await client.query<PlanVersion>(`SELECT p.id,p.name,v.id AS version_id,v.price::text,v.billing_cycle,v.max_listings,v.features
        FROM subscription_plans p JOIN subscription_plan_versions v ON v.plan_id=p.id
        WHERE p.id=$1 AND p.status='ACTIVE' AND v.status='ACTIVE' AND v.effective_from<=NOW() AND (v.effective_to IS NULL OR v.effective_to>NOW()) FOR UPDATE OF p,v`, [planId])).rows[0];
      if (!plan) throw new BadRequestException('Gói không hợp lệ hoặc đã ngừng bán.');
      const price = BigInt(plan.price);
      const order = (await client.query(`INSERT INTO subscription_orders(seller_id,plan_id,plan_version_id,price_snapshot,billing_cycle_snapshot,max_listings_snapshot,features_snapshot,idempotency_key,status)
        VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,'PENDING') RETURNING id`, [userId, plan.id, plan.version_id, price.toString(), plan.billing_cycle, plan.max_listings, JSON.stringify(plan.features ?? []), claim.scopedKey])).rows[0];
      let ledgerId: string | null = null;
      if (price > 0n) {
        await this.move(client, userId, -price, 'SPEND', 'SUBSCRIPTION_ORDER', order.id, `Mua ${plan.name}`);
        ledgerId = (await client.query(`INSERT INTO ledger_transactions(type,reference_id,idempotency_key,status) VALUES('SUBSCRIPTION_PURCHASE',$1,$2,'PENDING') RETURNING id`, [order.id, claim.scopedKey])).rows[0].id;
        await this.ledger.finalize(client, ledgerId!, [{ accountCode: 'PLATFORM_CASH', amount: price, userId }, { accountCode: 'SUBSCRIPTION_REVENUE', amount: -price, userId }]);
      }
      const subscriptionId = await this.activate(client, userId, plan, price);
      await client.query(`UPDATE subscription_orders SET status='PAID', ledger_transaction_id=$2, subscription_id=$3, paid_at=now(), updated_at=now() WHERE id=$1`, [order.id, ledgerId, subscriptionId]);
      const response = envelope({ orderId: order.id, subscriptionId }, `Đã kích hoạt ${plan.name}.`);
      await this.idempotency.complete(client, claim.scopedKey, response);
      this.notify(userId, 'SUBSCRIPTION_ACTIVATED', 'Đã kích hoạt gói đăng tin', `${plan.name} đã được kích hoạt. Cảm ơn bạn đã sử dụng dịch vụ.`, 'SUBSCRIPTION', subscriptionId);
      return response;
    });
  }
  /** Mua lại đúng gói đang dùng thì cộng dồn thời hạn; đổi sang gói khác thì áp dụng ngay và thay gói cũ. */
  private async activate(client: PoolClient, userId: string, plan: PlanVersion, price: bigint): Promise<string> {
    const active = (await client.query(`SELECT id, plan_id, ends_at FROM subscriptions WHERE seller_id=$1 AND status='ACTIVE' AND (ends_at IS NULL OR ends_at>NOW()) ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [userId])).rows[0];
    const interval = plan.billing_cycle === 'YEARLY' ? '1 year' : '1 month';
    if (active && active.plan_id === plan.id && active.ends_at) {
      await client.query(`UPDATE subscriptions SET ends_at = ends_at + $2::interval, price_snapshot=$3, plan_version_id=$4, max_listings_snapshot=$5, features_snapshot=$6::jsonb WHERE id=$1`, [active.id, interval, price.toString(), plan.version_id, plan.max_listings, JSON.stringify(plan.features ?? [])]);
      return active.id;
    }
    await client.query(`UPDATE subscriptions SET status='CANCELLED' WHERE seller_id=$1 AND status='ACTIVE'`, [userId]);
    return (await client.query(`INSERT INTO subscriptions(seller_id,plan_id,plan_version_id,price_snapshot,billing_cycle_snapshot,max_listings_snapshot,features_snapshot,starts_at,ends_at)
      VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,NOW(),NOW()+$8::interval) RETURNING id`, [userId, plan.id, plan.version_id, price.toString(), plan.billing_cycle, plan.max_listings, JSON.stringify(plan.features ?? []), interval])).rows[0].id;
  }

  // ---------- mua gói đẩy tin ----------
  async buyPromotion(userId: string, productId: string, packageId: string, key: string | undefined) {
    if (!/^[0-9a-f-]{36}$/i.test(String(productId)) || !/^[0-9a-f-]{36}$/i.test(String(packageId))) throw new BadRequestException('Tin đăng hoặc gói không hợp lệ.');
    return this.db.transaction(async client => {
      const claim = await this.idempotency.claim(client, 'billing-promo', userId, key, { productId, packageId });
      if (claim.replay) return claim.replay;
      const product = (await client.query(`SELECT id, title, status::text AS status FROM products WHERE id=$1 AND seller_id=$2 AND deleted_at IS NULL FOR UPDATE`, [productId, userId])).rows[0];
      if (!product) throw new BadRequestException('Không tìm thấy tin đăng của bạn.');
      if (product.status !== 'ACTIVE') throw new BadRequestException('Chỉ đẩy được tin đang hiển thị (đã duyệt).');
      const pk = (await client.query(`SELECT p.id,p.name,v.id AS version_id,v.price::text,v.duration_hours,v.promotion_type::text AS promotion_type
        FROM promotion_packages p JOIN promotion_package_versions v ON v.package_id=p.id
        WHERE p.id=$1 AND p.status='ACTIVE' AND v.status='ACTIVE' AND v.effective_from<=NOW() AND (v.effective_to IS NULL OR v.effective_to>NOW()) FOR UPDATE OF p,v`, [packageId])).rows[0];
      if (!pk) throw new BadRequestException('Gói không hợp lệ hoặc đã ngừng bán.');
      if (pk.promotion_type === 'FEATURED') {
        const running = await client.query(`SELECT 1 FROM promotion_activations WHERE product_id=$1 AND promotion_type='FEATURED' AND status='ACTIVE' AND ends_at>NOW()`, [productId]);
        if (running.rows.length) throw new ConflictException('Tin này đang trong thời gian nổi bật. Hãy mua lại khi gói hiện tại kết thúc.');
      }
      const price = BigInt(pk.price);
      const order = (await client.query(`INSERT INTO promotion_orders(seller_id,product_id,package_id,package_version_id,package_price_snapshot,duration_hours_snapshot,promotion_type_snapshot,idempotency_key,status)
        VALUES($1,$2,$3,$4,$5,$6,$7::promotion_type,$8,'PENDING') RETURNING id`, [userId, productId, pk.id, pk.version_id, price.toString(), pk.duration_hours, pk.promotion_type, claim.scopedKey])).rows[0];
      if (price > 0n) {
        await this.move(client, userId, -price, 'SPEND', 'PROMOTION_ORDER', order.id, `${pk.name}: ${String(product.title).slice(0, 60)}`);
        const ledgerId = (await client.query(`INSERT INTO ledger_transactions(type,reference_id,idempotency_key,status) VALUES('PROMOTION_PURCHASE',$1,$2,'PENDING') RETURNING id`, [order.id, claim.scopedKey])).rows[0].id;
        await this.ledger.finalize(client, ledgerId, [{ accountCode: 'PLATFORM_CASH', amount: price, userId }, { accountCode: 'PROMOTION_REVENUE', amount: -price, userId }]);
      }
      await client.query(`UPDATE promotion_orders SET status='PAID', paid_at=now() WHERE id=$1`, [order.id]);
      await client.query(`INSERT INTO promotion_activations(promotion_order_id,product_id,promotion_type,starts_at,ends_at) VALUES($1,$2,$3::promotion_type,NOW(),NOW()+($4::text||' hours')::interval) ON CONFLICT(promotion_order_id) DO NOTHING`, [order.id, productId, pk.promotion_type, pk.duration_hours]);
      if (pk.promotion_type === 'FEATURED') await client.query('UPDATE products SET is_featured=TRUE WHERE id=$1', [productId]);
      const response = envelope({ orderId: order.id }, `Đã kích hoạt ${pk.name} cho tin của bạn.`);
      await this.idempotency.complete(client, claim.scopedKey, response);
      this.notify(userId, 'PROMOTION_ACTIVATED', 'Đã kích hoạt gói đẩy tin', `${pk.name} đã được áp dụng cho tin “${String(product.title).slice(0, 80)}”.`, 'PRODUCT', productId);
      return response;
    });
  }

  // ---------- quản trị ----------
  async adminTopups(status?: string) {
    const where = status && ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(status) ? 'WHERE t.status=$1' : '';
    const rows = (await this.db.query(`SELECT t.id, t.code, t.amount::text, t.status, t.received_amount::text AS "receivedAmount", t.created_at AS "createdAt", t.expires_at AS "expiresAt", t.decided_at AS "decidedAt", t.reject_reason AS "rejectReason",
      t.user_id AS "userId", COALESCE(u.full_name,'') AS "userName", u.email, u.phone FROM topup_requests t LEFT JOIN users u ON u.id=t.user_id ${where} ORDER BY (t.status='PENDING') DESC, t.created_at DESC LIMIT 200`, where ? [status] : [])).rows;
    return envelope(rows);
  }
  async confirmTopup(actorId: string, id: string, received?: number) {
    return this.db.transaction(async client => {
      const t = (await client.query(`SELECT id,user_id,amount::text,code,status FROM topup_requests WHERE id=$1 FOR UPDATE`, [id])).rows[0];
      if (!t) throw new NotFoundException('Không tìm thấy yêu cầu nạp.');
      if (!['PENDING', 'EXPIRED'].includes(t.status)) throw new ConflictException('Yêu cầu này đã được xử lý.');
      const amount = received === undefined ? BigInt(t.amount) : BigInt(Math.trunc(Number(received)));
      if (amount <= 0n || amount > BigInt(MAX_TOPUP) * 10n) throw new BadRequestException('Số tiền thực nhận không hợp lệ.');
      const balance = await this.move(client, t.user_id, amount, 'TOPUP', 'TOPUP_REQUEST', t.id, `Nạp tiền ${t.code}`, actorId);
      await client.query(`UPDATE topup_requests SET status='CONFIRMED', received_amount=$2, decided_by=$3, decided_at=now() WHERE id=$1`, [id, amount.toString(), actorId]);
      this.notify(t.user_id, 'TOPUP_CONFIRMED', 'Nạp tiền thành công', `Ví của bạn vừa được cộng ${amount.toLocaleString('vi-VN')} đ (mã ${t.code}).`, 'TOPUP', t.id);
      return envelope({ id, balance: balance.toString() }, 'Đã cộng tiền vào ví khách hàng.');
    });
  }
  async rejectTopup(actorId: string, id: string, reason: string) {
    const text = String(reason ?? '').trim();
    if (text.length < 3 || text.length > 300) throw new BadRequestException('Nhập lý do từ chối (3–300 ký tự).');
    const r = await this.db.query(`UPDATE topup_requests SET status='REJECTED', reject_reason=$2, decided_by=$3, decided_at=now() WHERE id=$1 AND status IN ('PENDING','EXPIRED') RETURNING user_id, code`, [id, text, actorId]);
    if (!r.rowCount) throw new ConflictException('Yêu cầu này đã được xử lý hoặc không tồn tại.');
    this.notify(r.rows[0].user_id, 'TOPUP_REJECTED', 'Yêu cầu nạp tiền bị từ chối', `Yêu cầu nạp ${r.rows[0].code} bị từ chối. Lý do: ${text}`, 'TOPUP', id);
    return envelope({ id }, 'Đã từ chối yêu cầu.');
  }
  async adjustCredit(actorId: string, userId: string, amountInput: number, note: string) {
    const amount = Math.trunc(Number(amountInput)); const text = String(note ?? '').trim();
    if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 500_000_000) throw new BadRequestException('Số tiền điều chỉnh không hợp lệ.');
    if (text.length < 3 || text.length > 300) throw new BadRequestException('Nhập lý do điều chỉnh (3–300 ký tự).');
    if (!/^[0-9a-f-]{36}$/i.test(userId)) throw new BadRequestException('Người dùng không hợp lệ.');
    return this.db.transaction(async client => {
      if (!(await client.query('SELECT 1 FROM users WHERE id=$1', [userId])).rows.length) throw new NotFoundException('Không tìm thấy người dùng.');
      const balance = await this.move(client, userId, BigInt(amount), 'ADJUST', 'ADMIN', null, text, actorId);
      return envelope({ balance: balance.toString() }, 'Đã điều chỉnh số dư.');
    });
  }
  async adminCustomers(q?: string, status?: string) {
    const conds: string[] = []; const values: unknown[] = [];
    if (q?.trim()) { values.push('%' + q.trim().toLowerCase() + '%'); conds.push(`(lower(COALESCE(u.full_name,'')) LIKE $${values.length} OR lower(COALESCE(u.email,'')) LIKE $${values.length} OR COALESCE(u.phone,'') LIKE $${values.length})`); }
    if (status === 'ACTIVE') conds.push(`s.status='ACTIVE' AND (s.ends_at IS NULL OR s.ends_at>NOW())`);
    else if (status === 'EXPIRING') conds.push(`s.status='ACTIVE' AND s.ends_at>NOW() AND s.ends_at<NOW()+INTERVAL '7 days'`);
    else if (status === 'EXPIRED') conds.push(`(s.status='EXPIRED' OR (s.status='ACTIVE' AND s.ends_at<=NOW()))`);
    else if (status === 'CANCELLED') conds.push(`s.status='CANCELLED'`);
    const rows = (await this.db.query(`SELECT s.id, s.seller_id AS "userId", COALESCE(u.full_name,'Khách hàng') AS "userName", u.email, u.phone, p.name AS "planName", s.billing_cycle_snapshot AS "billingCycle",
        s.price_snapshot::text AS price, s.max_listings_snapshot AS "maxListings", s.status, s.starts_at AS "startsAt", s.ends_at AS "endsAt", s.created_at AS "createdAt",
        COALESCE(c.balance,0)::text AS balance,
        CASE WHEN s.status='ACTIVE' AND (s.ends_at IS NULL OR s.ends_at>NOW()) THEN 'ACTIVE' WHEN s.status='ACTIVE' THEN 'EXPIRED' ELSE s.status END AS "effectiveStatus"
      FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id LEFT JOIN users u ON u.id=s.seller_id LEFT JOIN credit_accounts c ON c.user_id=s.seller_id
      ${conds.length ? 'WHERE ' + conds.join(' AND ') : ''} ORDER BY s.created_at DESC LIMIT 300`, values)).rows;
    const stats = (await this.db.query(`SELECT
        (SELECT count(*) FROM subscriptions WHERE status='ACTIVE' AND (ends_at IS NULL OR ends_at>NOW()))::int AS active,
        (SELECT count(*) FROM subscriptions WHERE status='ACTIVE' AND ends_at>NOW() AND ends_at<NOW()+INTERVAL '7 days')::int AS expiring,
        COALESCE((SELECT sum(price_snapshot) FROM subscription_orders WHERE status='PAID' AND paid_at>=date_trunc('month',now())),0)::text AS "planRevenueMonth",
        COALESCE((SELECT sum(package_price_snapshot) FROM promotion_orders WHERE status='PAID' AND paid_at>=date_trunc('month',now())),0)::text AS "promoRevenueMonth",
        (SELECT count(*) FROM topup_requests WHERE status='PENDING')::int AS "pendingTopups"`)).rows[0];
    return envelope({ items: rows, stats });
  }
  async adminCancel(actorId: string, id: string) {
    const r = await this.db.query(`UPDATE subscriptions SET status='CANCELLED' WHERE id=$1 AND status='ACTIVE' RETURNING seller_id`, [id]);
    if (!r.rowCount) throw new ConflictException('Gói không còn hiệu lực.');
    this.notify(r.rows[0].seller_id, 'SUBSCRIPTION_CANCELLED', 'Gói đăng tin đã bị hủy', 'Gói đăng tin của bạn đã được quản trị viên hủy. Liên hệ hỗ trợ nếu cần biết thêm.', 'SUBSCRIPTION', id);
    await this.db.query(`INSERT INTO listing_audit_logs(actor_id,action,entity_id,detail) VALUES($1,'SUBSCRIPTION_CANCELLED',$2,'{}'::jsonb)`, [actorId, id]).catch(() => undefined);
    return envelope({ id }, 'Đã hủy gói của khách hàng.');
  }
  async adminExtend(actorId: string, id: string, days: number) {
    const d = Math.trunc(Number(days));
    if (!Number.isFinite(d) || d < 1 || d > 366) throw new BadRequestException('Số ngày gia hạn từ 1 đến 366.');
    const r = await this.db.query(`UPDATE subscriptions SET ends_at=GREATEST(COALESCE(ends_at,NOW()),NOW())+($2||' days')::interval, status='ACTIVE' WHERE id=$1 AND status IN ('ACTIVE','EXPIRED') RETURNING ends_at AS "endsAt", seller_id`, [id, String(d)]);
    if (!r.rows[0]) throw new ConflictException('Không thể gia hạn gói này.');
    this.notify(r.rows[0].seller_id, 'SUBSCRIPTION_EXTENDED', 'Gói đăng tin được gia hạn', `Gói của bạn được gia hạn thêm ${d} ngày.`, 'SUBSCRIPTION', id);
    await this.db.query(`INSERT INTO listing_audit_logs(actor_id,action,entity_id,detail) VALUES($1,'SUBSCRIPTION_EXTENDED',$2,$3::jsonb)`, [actorId, id, JSON.stringify({ days: d })]).catch(() => undefined);
    return envelope({ endsAt: r.rows[0].endsAt }, `Đã gia hạn thêm ${d} ngày.`);
  }
}
