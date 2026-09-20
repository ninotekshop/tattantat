import { PromotionExpiryController } from './promotion-expiry.controller';

describe('PromotionExpiryController', () => {
  it('runs expiration as the authenticated finance admin', async () => {
    const maintenance = { expire: jest.fn().mockResolvedValue(2) };
    const controller = new PromotionExpiryController(maintenance as never);

    await expect(controller.expire({ user: { id: 'admin-1' } })).resolves.toEqual({
      success: true, data: { expired: 2 }, message: null, errorCode: null,
    });
    expect(maintenance.expire).toHaveBeenCalledWith('admin-1');
  });
});
