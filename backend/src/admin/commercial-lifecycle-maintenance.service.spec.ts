import { CommercialLifecycleMaintenanceService } from './commercial-lifecycle-maintenance.service';

describe('CommercialLifecycleMaintenanceService', () => {
  it('expires subscriptions and campaigns with audit logs in one transaction', async () => {
    const client = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [{ acquired: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 'subscription-1', seller_id: 'seller-1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'campaign-1', seller_id: 'seller-2' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }) };
    const db = { transaction: jest.fn(async (work: (tx: typeof client) => unknown) => work(client)) };
    const service = new CommercialLifecycleMaintenanceService(db as never, { get: jest.fn() } as never);

    await expect(service.expire()).resolves.toEqual({ subscriptions: 1, campaigns: 1 });
    expect(client.query.mock.calls[3][0]).toContain('SUBSCRIPTION_EXPIRED');
    expect(client.query.mock.calls[4][0]).toContain('ADVERTISING_CAMPAIGN_EXPIRED');
  });
});
