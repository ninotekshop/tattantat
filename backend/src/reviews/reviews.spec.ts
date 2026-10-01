import { ReviewsService } from './reviews.service';

const ID = '11111111-1111-4111-8111-111111111111';
type Q = (sql: string, p?: unknown[]) => { rows: any[] };
function make(h: Q) {
  const client = { query: jest.fn(async (s: string, p?: unknown[]) => h(s, p)) };
  const db: any = { transaction: jest.fn(async (fn: any) => fn(client)), query: jest.fn(async (s: string, p?: unknown[]) => h(s, p)) };
  const notifications: any = { create: jest.fn().mockResolvedValue(undefined) };
  return { svc: new ReviewsService(db, notifications), client, notifications };
}
const order = (o: Record<string, unknown> = {}) => ({ buyer_id: 'buyer', seller_id: 'seller', order_code: 'OD1', status: 'COMPLETED', done_at: new Date().toISOString(), ...o });

describe('ReviewsService.create', () => {
  it('người mua đánh giá người bán vào seller_reviews và báo người bán', async () => {
    const { svc, client, notifications } = make(s => s.includes('FROM orders') ? { rows: [order()] } : s.includes('INSERT INTO seller_reviews') ? { rows: [{ id: 'r1', rating: 5 }] } : { rows: [] });
    const r = await svc.create('buyer', ID, 'buyer', { rating: 5, comment: 'Rất tốt' });
    expect(r.kind).toBe('seller');
    expect(client.query.mock.calls.some(c => String(c[0]).includes('INSERT INTO seller_reviews'))).toBe(true);
    expect(notifications.create).toHaveBeenCalledWith('seller', 'REVIEW_RECEIVED', expect.any(String), expect.any(String), 'ORDER', ID);
  });
  it('người bán đánh giá người mua vào buyer_reviews', async () => {
    const { svc, client } = make(s => s.includes('FROM orders') ? { rows: [order()] } : s.includes('INSERT INTO buyer_reviews') ? { rows: [{ id: 'r2', rating: 4 }] } : { rows: [] });
    const r = await svc.create('seller', ID, 'seller', { rating: 4 });
    expect(r.kind).toBe('buyer');
    expect(client.query.mock.calls.some(c => String(c[0]).includes('INSERT INTO buyer_reviews'))).toBe(true);
  });
  it('chặn: người ngoài, đơn chưa hoàn tất, quá 14 ngày, đã đánh giá', async () => {
    const old = new Date(Date.now() - 20 * 86_400_000).toISOString();
    await expect(make(() => ({ rows: [order()] })).svc.create('stranger', ID, 'buyer', { rating: 5 })).rejects.toThrow('Không tìm thấy');
    await expect(make(() => ({ rows: [order({ status: 'DELIVERED' })] })).svc.create('buyer', ID, 'buyer', { rating: 5 })).rejects.toThrow('hoàn tất');
    await expect(make(() => ({ rows: [order({ done_at: old })] })).svc.create('buyer', ID, 'buyer', { rating: 5 })).rejects.toThrow('quá 14 ngày');
    await expect(make(s => s.includes('FROM orders') ? { rows: [order()] } : { rows: [] }).svc.create('buyer', ID, 'buyer', { rating: 5 })).rejects.toThrow('đã đánh giá');
  });
});

describe('ReviewsService.reply/report', () => {
  it('chỉ phản hồi được một lần; loại đánh giá sai bị từ chối', async () => {
    await expect(make(() => ({ rows: [] })).svc.reply('seller', 'seller', ID, 'Cảm ơn bạn')).rejects.toThrow('Không thể phản hồi');
    await expect(make(() => ({ rows: [] })).svc.reply('seller', 'hack', ID, 'Cảm ơn bạn')).rejects.toThrow('Loại đánh giá');
    const { svc, notifications } = make(() => ({ rows: [{ author: 'buyer', order_id: ID }] }));
    await svc.reply('seller', 'seller', ID, 'Cảm ơn bạn nhiều');
    expect(notifications.create).toHaveBeenCalled();
  });
  it('chỉ người được đánh giá mới báo cáo được, và không báo cáo hai lần', async () => {
    await expect(make(() => ({ rows: [{ target: 'seller' }] })).svc.report('stranger', 'seller', ID, { reason: 'FAKE' })).rejects.toThrow('Chỉ người được đánh giá');
    await expect(make(() => ({ rows: [{ target: 'seller' }] })).svc.report('seller', 'seller', ID, { reason: 'XYZ' })).rejects.toThrow('lý do');
    const dup = make(s => (s.includes('INSERT INTO review_reports') ? { rows: [] } : { rows: [{ target: 'seller' }] }));
    await expect(dup.svc.report('seller', 'seller', ID, { reason: 'FAKE' })).rejects.toThrow('đã báo cáo');
  });
});
