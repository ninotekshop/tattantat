import { BadRequestException } from '@nestjs/common';
import { createGateway, MockGateway, PayosGateway, __test } from './gateway/payment-gateway';
import { OnlinePaymentsService } from './online-payments.service';
import { queueRefund } from './refund-queue';

const signed = (key: string, data: Record<string, unknown>, success = true) => ({ code: '00', desc: 'success', success, data, signature: __test.hmac(key, Object.keys(data).sort().map(k => `${k}=${data[k] ?? ''}`).join('&')) });

describe('payment gateways', () => {
  it('PayOS verifies webhook signature and rejects tampering', () => {
    const g = new PayosGateway('id', 'key', 'secret');
    const data = { orderCode: 1700000000012, amount: 150000, description: 'TTT-ABC', reference: 'FT123', paymentLinkId: 'pl', code: '00', desc: 'success' };
    const good = g.parseWebhook(signed('secret', data));
    expect(good).toMatchObject({ providerCode: '1700000000012', status: 'PAID', amount: 150000, transactionId: 'FT123' });
    expect(g.parseWebhook(signed('wrong', data))).toBeNull();
    const tampered = signed('secret', data); (tampered.data as any).amount = 1;
    expect(g.parseWebhook(tampered)).toBeNull();
    expect(g.parseWebhook({ data })).toBeNull();
  });
  it('selects gateway from environment and refuses unconfigured production', () => {
    expect(createGateway({ PAYMENT_GATEWAY: 'mock' } as any)).toBeInstanceOf(MockGateway);
    expect(() => createGateway({ NODE_ENV: 'production' } as any)).toThrow();
    expect(() => createGateway({ PAYMENT_GATEWAY: 'payos' } as any)).toThrow();
    expect(createGateway({ PAYMENT_GATEWAY: 'payos', PAYOS_CLIENT_ID: 'a', PAYOS_API_KEY: 'b', PAYOS_CHECKSUM_KEY: 'c' } as any)).toBeInstanceOf(PayosGateway);
  });
});

describe('queueRefund', () => {
  it('does nothing for COD / unpaid orders and queues once for paid online orders', async () => {
    const none = { query: jest.fn(async () => ({ rows: [] })) };
    expect(await queueRefund(none, 'o', 'r')).toBe(false);
    expect(none.query).toHaveBeenCalledTimes(1);
    const q = jest.fn().mockResolvedValueOnce({ rows: [{ id: 'p', amount: '100000.00' }] }).mockResolvedValue({ rows: [] });
    expect(await queueRefund({ query: q }, 'o', 'Người mua hủy đơn')).toBe(true);
    expect(q.mock.calls.map(c => String(c[0]))).toEqual(expect.arrayContaining([expect.stringContaining('payment_refund_tasks'), expect.stringContaining("status='PROCESSING'")]));
  });
});

describe('OnlinePaymentsService', () => {
  const svc = (db: any) => new OnlinePaymentsService(db, { create: jest.fn(async () => undefined) } as any);
  it('rejects webhook for unknown provider/invalid signature', async () => {
    const s = svc({ query: jest.fn(async () => ({ rows: [] })) });
    await expect(s.handleWebhook('payos', {})).rejects.toBeDefined();
    (s as any).gw = new PayosGateway('a', 'b', 'c');
    await expect(s.handleWebhook('payos', { data: { amount: 1 }, signature: 'x' })).rejects.toThrow('Chữ ký');
  });
  it('is idempotent: a replayed webhook event changes nothing', async () => {
    const c = { query: jest.fn(async () => ({ rows: [], rowCount: 0 })) };
    const s = svc({ transaction: async (fn: any) => fn(c), query: jest.fn() });
    const r = await s.settle('MOCK', { providerCode: '1', status: 'PAID', transactionId: 't', amount: 1000 }, {}, 'k');
    expect(r).toEqual({ replay: true });
    expect(c.query).toHaveBeenCalledTimes(1);
  });
  it('rejects mismatched amounts', async () => {
    const q = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'e' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ id: 'p', order_id: 'o', amount: '5000', status: 'PENDING', order_status: 'PENDING', order_code: 'X' }] });
    const s = svc({ transaction: async (fn: any) => fn({ query: q }) });
    await expect(s.settle('MOCK', { providerCode: '1', status: 'PAID', transactionId: 't', amount: 1000 }, {}, 'k')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('validates escrow settings', async () => {
    const s = svc({ query: jest.fn(async () => ({ rows: [] })) });
    await expect(s.saveSettings('a', { autoConfirmDays: 0 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(s.saveSettings('a', { autoConfirmDays: 5 })).resolves.toMatchObject({ autoConfirmDays: 5, shipDeadlineDays: 5, paymentExpiryMinutes: 30 });
  });
});
