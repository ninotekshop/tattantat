import { ServicePricingAdminController } from './service-pricing-admin.controller';

describe('ServicePricingAdminController', () => {
  const actor = { user: { id: '00000000-0000-4000-8000-000000000001' } };

  it('creates a promotion version, closes the previous period, and audits it', async () => {
    const client = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'package-1' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'version-2' }] })
      .mockResolvedValueOnce({ rows: [] }) };
    const db = { transaction: jest.fn(async (work: (tx: typeof client) => unknown) => work(client)) };
    const controller = new ServicePricingAdminController(db as never);

    await expect(controller.createPromotionVersion(actor, 'package-1', {
      price: '79000', durationHours: 168, promotionType: 'FEATURED', reason: 'Điều chỉnh giá mùa mới',
    })).resolves.toMatchObject({ success: true, data: { id: 'version-2' } });
    expect(client.query.mock.calls[1][0]).toContain('UPDATE promotion_package_versions SET effective_to');
    expect(client.query.mock.calls[3][0]).toContain('financial_audit_logs');
  });

  it('rejects an invalid subscription listing limit before a price version is written', async () => {
    const client = { query: jest.fn().mockResolvedValueOnce({ rows: [{ id: 'plan-1' }] }) };
    const db = { transaction: jest.fn(async (work: (tx: typeof client) => unknown) => work(client)) };
    const controller = new ServicePricingAdminController(db as never);

    await expect(controller.createSubscriptionVersion(actor, 'plan-1', {
      price: '99000', billingCycle: 'MONTHLY', maxListings: 0, reason: 'Kiểm tra',
    })).rejects.toThrow('maxListings không hợp lệ');
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it('lists the current effective promotion package version for admin configuration', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [{ id: 'package-1', price: '79000' }] }) };
    const controller = new ServicePricingAdminController(db as never);
    await expect(controller.promotionPackages()).resolves.toMatchObject({ success: true, data: [{ id: 'package-1', price: '79000' }] });
  });
});
