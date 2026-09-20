import { PricingService } from './pricing.service';

describe('PricingService', () => {
  const quoteFor = async (rateBps: number) => {
    const db = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ price: '10000000.00' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'pricing-v1', rate_bps: rateBps }] }),
    };
    return new PricingService(db as never).preview('product-1');
  };

  it('snapshots a 3% VND platform fee without floating point math', async () => {
    const quote = await quoteFor(300);
    expect(quote.platformFee).toBe(300_000n);
    expect(quote.sellerPayout).toBe(9_700_000n);
    expect(quote.platformFeeRateBps).toBe(300);
  });

  it('keeps the beta rule at zero fee', async () => {
    const quote = await quoteFor(0);
    expect(quote.platformFee).toBe(0n);
    expect(quote.sellerPayout).toBe(10_000_000n);
  });
});
