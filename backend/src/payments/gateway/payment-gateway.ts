import { BadRequestException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

export type CheckoutInput = { providerCode: number; amount: number; description: string; returnUrl: string; cancelUrl: string };
export type WebhookResult = { providerCode: string; status: 'PAID' | 'FAILED'; transactionId: string; amount: number };
export type QrInfo = { qrCode: string | null; bin: string | null; accountNumber: string | null; accountName: string | null; description: string | null };
export type CheckoutResult = { checkoutUrl: string; providerRef: string | null; qr?: QrInfo };
export interface PaymentGateway {
  readonly name: 'MOCK' | 'PAYOS';
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Hỏi trực tiếp cổng về trạng thái giao dịch (dùng khi webhook chưa tới, ví dụ chạy localhost). */
  getStatus?(providerCode: number): Promise<WebhookResult | null>;
  /** Trả về null nếu chữ ký không hợp lệ. */
  parseWebhook(body: Record<string, unknown>): WebhookResult | null;
}

const hmac = (key: string, data: string) => createHmac('sha256', key).update(data).digest('hex');
const safeEqual = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export class MockGateway implements PaymentGateway {
  readonly name = 'MOCK' as const;
  constructor(private readonly webBase: string) {}
  async createCheckout(i: CheckoutInput): Promise<CheckoutResult> { return { checkoutUrl: `${this.webBase}/thanh-toan/mock?code=${i.providerCode}&amount=${i.amount}`, providerRef: null }; }
  parseWebhook(): WebhookResult | null { return null; } // cổng giả lập không có webhook; xác nhận qua endpoint thử nghiệm
}

/** PayOS (https://payos.vn): tạo link thanh toán VietQR, xác thực webhook bằng HMAC-SHA256 với Checksum Key. */
export class PayosGateway implements PaymentGateway {
  readonly name = 'PAYOS' as const;
  constructor(private readonly clientId: string, private readonly apiKey: string, private readonly checksumKey: string) {}
  async createCheckout(i: CheckoutInput): Promise<CheckoutResult> {
    const description = i.description.slice(0, 25);
    const signature = hmac(this.checksumKey, `amount=${i.amount}&cancelUrl=${i.cancelUrl}&description=${description}&orderCode=${i.providerCode}&returnUrl=${i.returnUrl}`);
    const res = await fetch('https://api-merchant.payos.vn/v2/payment-requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-client-id': this.clientId, 'x-api-key': this.apiKey }, body: JSON.stringify({ orderCode: i.providerCode, amount: i.amount, description, cancelUrl: i.cancelUrl, returnUrl: i.returnUrl, signature }) });
    const j = await res.json().catch(() => null) as { code?: string; data?: { checkoutUrl?: string; paymentLinkId?: string; qrCode?: string; bin?: string; accountNumber?: string; accountName?: string; description?: string } } | null;
    if (!res.ok || j?.code !== '00' || !j.data?.checkoutUrl) throw new BadRequestException('Không tạo được liên kết thanh toán. Vui lòng thử lại sau.');
    return { checkoutUrl: j.data.checkoutUrl, providerRef: j.data.paymentLinkId ?? null, qr: { qrCode: j.data.qrCode ?? null, bin: j.data.bin ?? null, accountNumber: j.data.accountNumber ?? null, accountName: j.data.accountName ?? null, description: j.data.description ?? null } };
  }
  async getStatus(providerCode: number): Promise<WebhookResult | null> {
    const res = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${providerCode}`, { headers: { 'x-client-id': this.clientId, 'x-api-key': this.apiKey } });
    const j = await res.json().catch(() => null) as { code?: string; data?: { status?: string; amountPaid?: number; amount?: number; transactions?: { reference?: string }[] } } | null;
    if (!res.ok || j?.code !== '00' || !j.data) return null;
    const d = j.data;
    if (d.status === 'PAID') return { providerCode: String(providerCode), status: 'PAID', transactionId: String(d.transactions?.[0]?.reference ?? providerCode), amount: Number(d.amountPaid ?? d.amount) };
    if (d.status === 'CANCELLED' || d.status === 'EXPIRED') return { providerCode: String(providerCode), status: 'FAILED', transactionId: String(providerCode), amount: Number(d.amount ?? 0) };
    return null;
  }
  parseWebhook(body: Record<string, unknown>): WebhookResult | null {
    const data = body.data as Record<string, unknown> | undefined; const signature = String(body.signature ?? '');
    if (!data || typeof data !== 'object' || !signature) return null;
    const text = Object.keys(data).sort().map(k => `${k}=${data[k] === null || data[k] === undefined || data[k] === 'null' || data[k] === 'undefined' ? '' : String(data[k])}`).join('&');
    if (!safeEqual(hmac(this.checksumKey, text), signature)) return null;
    const amount = Number(data.amount);
    if (!Number.isSafeInteger(amount)) return null;
    return { providerCode: String(data.orderCode), status: body.success === true && data.code === '00' ? 'PAID' : 'FAILED', transactionId: String(data.reference ?? data.paymentLinkId ?? data.orderCode), amount };
  }
}

export function createGateway(env: NodeJS.ProcessEnv = process.env): PaymentGateway {
  const kind = (env.PAYMENT_GATEWAY ?? (env.NODE_ENV === 'production' ? '' : 'mock')).toLowerCase();
  if (kind === 'payos') {
    if (!env.PAYOS_CLIENT_ID || !env.PAYOS_API_KEY || !env.PAYOS_CHECKSUM_KEY) throw new Error('Thiếu PAYOS_CLIENT_ID / PAYOS_API_KEY / PAYOS_CHECKSUM_KEY');
    return new PayosGateway(env.PAYOS_CLIENT_ID, env.PAYOS_API_KEY, env.PAYOS_CHECKSUM_KEY);
  }
  if (kind === 'mock') return new MockGateway((env.PUBLIC_WEB_URL ?? 'http://localhost:3001').replace(/\/$/, ''));
  throw new Error('Chưa cấu hình PAYMENT_GATEWAY (mock | payos)');
}
export const __test = { hmac };
