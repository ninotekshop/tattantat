import { AdvertisingController } from './advertising.controller';

describe('AdvertisingController', () => {
  it('does not let a seller create a campaign for another seller product', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const db = { transaction: jest.fn(async (work: (tx: typeof client) => unknown) => work(client)) };
    const idempotency = { claim: jest.fn().mockResolvedValue({ scopedKey: 'advertising-create:seller-1:key' }), complete: jest.fn() };
    const controller = new AdvertisingController(db as never, idempotency as never, {} as never);

    await expect(controller.create({ user: { id: 'seller-1' } }, {
      productId: 'foreign-product', campaignType: 'SPONSORED_PRODUCT', budget: '10000',
    }, 'key')).rejects.toThrow('Sản phẩm quảng cáo không hợp lệ');
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it('requires a campaign end after its start', async () => {
    const controller = new AdvertisingController({ transaction: jest.fn() } as never, {} as never, {} as never);
    await expect(controller.create({ user: { id: 'seller-1' } }, {
      campaignType: 'BANNER', budget: '10000', startAt: '2026-09-20T00:00:00Z', endAt: '2026-09-19T00:00:00Z',
    }, 'key')).rejects.toThrow('endAt phải sau startAt');
  });
});
