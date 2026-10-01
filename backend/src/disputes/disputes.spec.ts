import { DisputesService } from './disputes.service';

const ID = '11111111-1111-4111-8111-111111111111';
const ADMIN = '99999999-9999-4999-8999-999999999999';
type Q = (sql: string, p?: unknown[]) => { rows: any[] };
function make(handler: Q, refundResult: any = { data: { amount: '500000' } }) {
  const client = { query: jest.fn(async (sql: string, p?: unknown[]) => handler(sql, p)) };
  const db: any = { transaction: jest.fn(async (fn: any) => fn(client)), query: jest.fn(async (sql: string, p?: unknown[]) => handler(sql, p)) };
  const notifications: any = { create: jest.fn().mockResolvedValue(undefined) };
  const refunds: any = { refund: jest.fn().mockResolvedValue(refundResult) };
  return { svc: new DisputesService(db, notifications, refunds), client, db, notifications, refunds };
}
const order = (o: Record<string, unknown> = {}) => ({ id: ID, order_code: 'OD1', buyer_id: 'buyer', seller_id: 'seller', status: 'DELIVERED', done_at: new Date().toISOString(), ...o });

describe('DisputesService.open', () => {
  it('người mua mở khiếu nại đơn đã giao: chuyển đơn sang DISPUTED và báo người bán', async () => {
    const { svc, client, notifications } = make(sql => sql.includes('FROM orders WHERE id=$1 FOR UPDATE') ? { rows: [order()] } : sql.includes("status IN ('OPEN','REVIEWING')") ? { rows: [] } : sql.includes('INSERT INTO order_disputes') ? { rows: [{ id: 'd1' }] } : sql.includes('FROM users u') ? { rows: [{ id: 'adm' }] } : { rows: [] });
    await svc.open('buyer', ID, { reason: 'NOT_AS_DESCRIBED', description: 'Máy bị trầy xước nặng không như mô tả' });
    expect(client.query.mock.calls.some(c => String(c[0]).includes("order_status='DISPUTED'"))).toBe(true);
    expect(notifications.create).toHaveBeenCalled();
  });
  it('chặn: mô tả ngắn, lý do sai vai trò, người ngoài, đã có khiếu nại, quá hạn 7 ngày', async () => {
    const base = { reason: 'NOT_AS_DESCRIBED', description: 'Mô tả đủ dài để hợp lệ' };
    await expect(make(() => ({ rows: [order()] })).svc.open('buyer', ID, { ...base, description: 'ngắn' })).rejects.toThrow('Mô tả');
    await expect(make(() => ({ rows: [order()] })).svc.open('seller', ID, base)).rejects.toThrow('người mua');
    await expect(make(() => ({ rows: [order()] })).svc.open('stranger', ID, base)).rejects.toThrow('không phải');
    await expect(make(sql => sql.includes('FOR UPDATE') ? { rows: [order()] } : { rows: [{ x: 1 }] }).svc.open('buyer', ID, base)).rejects.toThrow('chưa xử lý');
    const old = new Date(Date.now() - 10 * 86_400_000).toISOString();
    await expect(make(sql => sql.includes('FOR UPDATE') ? { rows: [order({ status: 'COMPLETED', done_at: old })] } : { rows: [] }).svc.open('buyer', ID, base)).rejects.toThrow('quá 7 ngày');
  });
});

describe('DisputesService.resolve', () => {
  const dispute = (o: Record<string, unknown> = {}) => ({ id: 'd1', status: 'OPEN', order_id: ID, prior_order_status: 'DELIVERED', order_code: 'OD1', order_status: 'DISPUTED', pay: 'PAID', buyer_id: 'buyer', seller_id: 'seller', product_id: 'p1', total: '500000.00', ...o });
  const h = (d: any): Q => sql => (sql.includes('FROM order_disputes d JOIN orders o') ? { rows: [d] } : { rows: [] });
  it('bác khiếu nại đơn DISPUTED: trả đơn về trạng thái trước đó', async () => {
    const { svc, client } = make(h(dispute()));
    const r = await svc.resolve(ADMIN, 'd1', { decision: 'REJECT', note: 'Bằng chứng không đủ' });
    expect(r.decision).toBe('REJECT');
    expect(client.query.mock.calls.some(c => String(c[0]).includes('order_status=$2::order_status'))).toBe(true);
  });
  it('hoàn tiền đơn chưa hoàn tất: hủy đơn, đánh dấu REFUNDED và yêu cầu chuyển tiền thủ công', async () => {
    const { svc, refunds } = make(h(dispute()));
    const r = await svc.resolve(ADMIN, 'd1', { decision: 'REFUND_FULL', note: 'Hàng không đúng mô tả' });
    expect(r.manualTransfer).toBe(true); expect(r.refunded).toBe('500000'); expect(refunds.refund).not.toHaveBeenCalled();
  });
  it('đơn đã hoàn tất: dùng RefundsService với khóa idempotency theo khiếu nại', async () => {
    const { svc, refunds } = make(h(dispute({ order_status: 'COMPLETED' })));
    const r = await svc.resolve(ADMIN, 'd1', { decision: 'REFUND_PARTIAL', amount: '200000', note: 'Trừ phí lỗi nhỏ' });
    expect(refunds.refund).toHaveBeenCalledWith(ADMIN, ID, expect.objectContaining({ amount: '200000' }), 'dispute-d1');
    expect(r.refunded).toBe('500000');
  });
  it('từ chối: thiếu lý do, hoàn một phần khi đơn chưa hoàn tất, khiếu nại đã xử lý', async () => {
    await expect(make(h(dispute())).svc.resolve(ADMIN, 'd1', { decision: 'REJECT', note: 'ok' })).rejects.toThrow('lý do');
    await expect(make(h(dispute())).svc.resolve(ADMIN, 'd1', { decision: 'REFUND_PARTIAL', amount: '1000', note: 'Hoàn một phần thử' })).rejects.toThrow('hoàn tất');
    await expect(make(h(dispute({ status: 'RESOLVED' }))).svc.resolve(ADMIN, 'd1', { decision: 'REJECT', note: 'Đã xử lý rồi mà' })).rejects.toThrow('đã được xử lý');
  });
});
