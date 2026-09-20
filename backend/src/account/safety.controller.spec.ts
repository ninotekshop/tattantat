import { SafetyController } from './safety.controller';

describe('SafetyController', () => {
  it('rejects a report targeting the reporter themself', async () => {
    const db = { transaction: jest.fn(async (work: (value: { query: jest.Mock }) => Promise<unknown>) => work({ query: jest.fn() })) };
    const controller = new SafetyController(db as never);

    await expect(controller.report({ user: { id: 'user-1' } }, { reportedUserId: 'user-1', reason: 'SPAM' })).rejects.toThrow('Không thể báo cáo chính mình');
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it('derives a product report target from the product seller instead of trusting client input', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ seller_id: 'seller-1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'seller-1' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'report-1', status: 'OPEN' }] }),
    };
    const db = { transaction: jest.fn(async (work: (value: typeof client) => Promise<unknown>) => work(client)) };
    const controller = new SafetyController(db as never);

    const result = await controller.report({ user: { id: 'buyer-1' } }, { productId: 'product-1', reason: 'FRAUD' });

    expect(result.data).toEqual({ id: 'report-1', status: 'OPEN' });
    expect(client.query.mock.calls[2][1]).toEqual(['buyer-1', 'seller-1', 'product-1', 'FRAUD', null]);
  });
});
