import { RevenueProjectionService } from './revenue-projection.service';

describe('RevenueProjectionService', () => {
  it('upserts a VND daily projection from immutable financial sources', async () => {
    const client = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [{ total_orders: 1, gmv: '10000000', seller_payout: '9700000', platform_fee: '300000', payment_processing_cost: '0', promotion_revenue: '0', subscription_revenue: '0', advertising_revenue: '0', shipping_margin: '0', refund_volume: '0' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'rollup-1', net_revenue: '300000' }] })
      .mockResolvedValueOnce({ rows: [] }) };
    const db = { transaction: jest.fn(async (work: (tx: typeof client) => unknown) => work(client)) };
    const service = new RevenueProjectionService(db as never);

    await expect(service.refresh('2026-09-19', 'admin-1')).resolves.toEqual({ id: 'rollup-1', net_revenue: '300000' });
    expect(client.query.mock.calls[1][1]).toContain('300000');
    expect(client.query.mock.calls[2][1][0]).toBe('admin-1');
  });
});
