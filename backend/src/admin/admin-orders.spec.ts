import { AdminOrdersController } from './admin-orders.controller';

function make(order: Record<string, unknown> | null) {
  const client = { query: jest.fn(async (sql: string) => (sql.includes('FOR UPDATE') ? { rows: order ? [order] : [] } : { rows: [] })) };
  const db: any = { transaction: jest.fn(async (fn: any) => fn(client)), query: jest.fn().mockResolvedValue({ rows: [] }) };
  const notifications: any = { create: jest.fn().mockResolvedValue(undefined) };
  const audit: any = { log: jest.fn().mockResolvedValue(undefined) };
  return { ctl: new AdminOrdersController(db, notifications, audit), client, notifications, audit };
}
const ID = '11111111-1111-4111-8111-111111111111';
const req = { user: { id: '22222222-2222-4222-8222-222222222222' } };
const base = { id: ID, order_code: 'OD1', buyer_id: 'b1', seller_id: 's1', product_id: 'p1', status: 'PENDING', pay: 'PENDING' };

describe('AdminOrdersController', () => {
  it('chuyển trạng thái hợp lệ, ghi lịch sử, nhật ký và báo cho cả hai bên', async () => {
    const { ctl, client, notifications, audit } = make(base);
    const r = await ctl.changeStatus(req, ID, { status: 'CONFIRMED' });
    expect(r.success).toBe(true);
    expect(client.query.mock.calls.some((c: any[]) => String(c[0]).includes('order_status_history'))).toBe(true);
    expect(audit.log).toHaveBeenCalled();
    expect(notifications.create).toHaveBeenCalledTimes(2);
  });
  it('bắt buộc lý do khi hủy và giải phóng sản phẩm', async () => {
    const { ctl, client } = make(base);
    await expect(ctl.changeStatus(req, ID, { status: 'CANCELLED' })).rejects.toThrow('lý do');
    await ctl.changeStatus(req, ID, { status: 'CANCELLED', reason: 'Người mua không phản hồi' });
    expect(client.query.mock.calls.some((c: any[]) => String(c[0]).includes("status='ACTIVE'"))).toBe(true);
  });
  it('không cho hủy đơn đã thanh toán và không cho hoàn tất thủ công', async () => {
    await expect(make({ ...base, pay: 'PAID' }).ctl.changeStatus(req, ID, { status: 'CANCELLED', reason: 'thử hủy' })).rejects.toThrow('hoàn tiền');
    await expect(make({ ...base, status: 'DELIVERED' }).ctl.changeStatus(req, ID, { status: 'COMPLETED' })).rejects.toThrow('tài chính');
    await expect(make(base).ctl.changeStatus(req, ID, { status: 'SHIPPING' })).rejects.toThrow('Không thể chuyển');
    await expect(make(null).ctl.changeStatus(req, ID, { status: 'CONFIRMED' })).rejects.toThrow('Không tìm thấy');
  });
  it('từ chối bộ lọc sai định dạng', async () => {
    const { ctl } = make(base);
    await expect(ctl.list({ from: '31/12/2026' })).rejects.toThrow('Ngày lọc');
    await expect(ctl.list({ status: 'HACK' })).rejects.toThrow('Trạng thái');
    await expect(ctl.list({ minAmount: '1;DROP' })).rejects.toThrow('Số tiền');
  });
});
