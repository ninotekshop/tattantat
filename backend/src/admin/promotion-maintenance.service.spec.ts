import { PromotionMaintenanceService } from './promotion-maintenance.service';

describe('PromotionMaintenanceService', () => {
  it('expires promotions once, clears only affected product flags, and writes audit evidence', async () => {
    const client = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [{ acquired: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 'activation-a', product_id: 'product-a' }, { id: 'activation-b', product_id: 'product-a' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }) };
    const db = { transaction: jest.fn(async (work: (tx: typeof client) => unknown) => work(client)) };
    const config = { get: jest.fn() };
    const service = new PromotionMaintenanceService(db as never, config as never, { refresh: jest.fn() } as never);

    await expect(service.expire('admin-1')).resolves.toBe(2);
    expect(client.query.mock.calls[2][1]).toEqual([['product-a']]);
    expect(client.query.mock.calls[3][1][0]).toBe('admin-1');
    expect(client.query.mock.calls[4][1][0]).toBe('admin-1');
  });

  it('does nothing when another backend instance owns the advisory lock', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [{ acquired: false }] }) };
    const db = { transaction: jest.fn(async (work: (tx: typeof client) => unknown) => work(client)) };
    const config = { get: jest.fn() };
    const service = new PromotionMaintenanceService(db as never, config as never, { refresh: jest.fn() } as never);

    await expect(service.expire()).resolves.toBe(0);
    expect(client.query).toHaveBeenCalledTimes(1);
  });
});
