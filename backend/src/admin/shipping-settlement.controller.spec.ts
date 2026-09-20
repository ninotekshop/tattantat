import { ShippingSettlementController } from './shipping-settlement.controller';

describe('ShippingSettlementController pending queue', () => {
  it('uses a bounded pending-shipping query', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const controller = new ShippingSettlementController(db as never, {} as never, {} as never);
    await expect(controller.pending('20')).resolves.toMatchObject({ success: true, data: [], meta: { limit: 20 } });
    expect(db.query.mock.calls[0][1]).toEqual([20]);
  });

  it('rejects an unsafe pending-shipping limit', async () => {
    const db = { query: jest.fn() };
    const controller = new ShippingSettlementController(db as never, {} as never, {} as never);
    await expect(controller.pending('0')).rejects.toThrow('limit không hợp lệ');
  });
});
