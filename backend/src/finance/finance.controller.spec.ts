import { AdminPayoutsController } from './finance.controller';

describe('AdminPayoutsController', () => {
  it('rejects unknown payout statuses before listing', async () => {
    const payouts = { listForAdmin: jest.fn() };
    const controller = new AdminPayoutsController(payouts as never);
    await expect(controller.list('INJECTED', undefined)).rejects.toThrow('status payout không hợp lệ');
    expect(payouts.listForAdmin).not.toHaveBeenCalled();
  });

  it('uses a bounded admin payout list', async () => {
    const payouts = { listForAdmin: jest.fn().mockResolvedValue([]) };
    const controller = new AdminPayoutsController(payouts as never);
    await expect(controller.list('REQUESTED', '25')).resolves.toMatchObject({ success: true, data: [] });
    expect(payouts.listForAdmin).toHaveBeenCalledWith('REQUESTED', 25);
  });
});
