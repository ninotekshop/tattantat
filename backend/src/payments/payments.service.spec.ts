import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  it('creates one pending COD payment for a new idempotent request', async () => {
    const client = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'order-1', buyer_id: 'buyer-1', total_amount: '500000', payment_status: 'PENDING' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'payment-1', order_id: 'order-1', payment_code: 'COD-x', provider: 'COD', amount: '500000', currency: 'VND', status: 'PENDING', paid_at: null, created_at: new Date() }] }) };
    const db = { transaction: jest.fn((work: (value: unknown) => unknown) => work(client)) };
    const idempotency = { claim: jest.fn().mockResolvedValue({ scopedKey: 'payment-create:buyer-1:key-1' }), complete: jest.fn().mockResolvedValue(undefined) };
    const service = new PaymentsService(db as never, idempotency as never);
    const response = await service.create('buyer-1', { orderId: 'order-1', method: 'COD' }, 'key-1');
    expect(response.data).toMatchObject({ id: 'payment-1', amount: '500000', status: 'PENDING' });
    expect(client.query).toHaveBeenCalledTimes(3);
  });

  it('replays a duplicate payment request without querying or inserting a new payment', async () => {
    const saved = { success: true, data: { id: 'payment-1' }, message: 'Đã ghi nhận yêu cầu COD', errorCode: null };
    const client = { query: jest.fn() };
    const db = { transaction: jest.fn((work: (value: unknown) => unknown) => work(client)) };
    const idempotency = { claim: jest.fn().mockResolvedValue({ scopedKey: 'payment-create:buyer-1:key-1', replay: saved }), complete: jest.fn() };
    const service = new PaymentsService(db as never, idempotency as never);
    await expect(service.create('buyer-1', { orderId: 'order-1', method: 'COD' }, 'key-1')).resolves.toEqual(saved);
    expect(client.query).not.toHaveBeenCalled();
  });
});
