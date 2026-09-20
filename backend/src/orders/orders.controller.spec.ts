import { OrdersController } from './orders.controller';

describe('OrdersController pricing snapshot', () => {
  it('persists the effective pricing version, rate, fee and seller payout on order creation', async () => {
    const client = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'product-1', seller_id: 'seller-1', title: 'Laptop', price: '10000000' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'order-1' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }) };
    const db = {
      query: jest.fn(),
      transaction: jest.fn((work: (value: unknown) => unknown) => work(client)),
    };
    const quote = { pricingVersionId: 'pricing-v3', platformFeeRateBps: 300, subtotal: 10_000_000n, discountAmount: 0n, shippingFee: 0n, paymentFee: 0n, platformFee: 300_000n, buyerTotal: 10_000_000n, sellerPayout: 9_700_000n, netPlatformRevenue: 300_000n };
    const pricing = { preview: jest.fn().mockResolvedValue(quote), serializeQuote: jest.fn().mockReturnValue({ platformFee: '300000', sellerPayout: '9700000' }) };
    const idempotency = { claim: jest.fn().mockResolvedValue({ scopedKey: 'order-create:buyer-1:key-1' }), complete: jest.fn().mockResolvedValue(undefined) };
    const controller = new OrdersController(db as never, pricing as never, idempotency as never);

    await controller.create({ user: { id: 'buyer-1' } }, { productId: 'product-1', quantity: 1 }, 'key-1');

    const insertValues = client.query.mock.calls[1][1] as unknown[];
    expect(insertValues[7]).toBe('pricing-v3');
    expect(insertValues[8]).toBe(300);
    expect(insertValues[9]).toBe('300000');
    expect(insertValues[11]).toBe('9700000');
  });
});
