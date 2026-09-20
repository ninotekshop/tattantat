import { ValidationPipe } from '@nestjs/common';
import { CreateOrderDto, OrdersController } from './orders.controller';
import { PricingService } from '../pricing/pricing.service';
import { UpdateProfileDto } from '../account/account.controller';
const quote = { pricingVersionId: 'v1', platformFeeRateBps: 300, subtotal: 10000000n, discountAmount: 0n, shippingFee: 0n, paymentFee: 0n, platformFee: 300000n, buyerTotal: 10000000n, sellerPayout: 9700000n, netPlatformRevenue: 300000n };
describe('Web order confirmation contracts', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });
  it('forbids client-calculated money and invalid quantities', async () => {
    const base = { productId: '0f5fb1e0-d4d8-4516-a89c-c99e97c048ef' };
    for (const extra of [{ platform_fee: 0 }, { seller_payout: '10' }, { quantity: 0 }, { quantity: 1.5 }, { note: 'x'.repeat(1001) }, { quoteFingerprint: 'invalid' }]) {
      await expect(pipe.transform({ ...base, ...extra }, { type: 'body', metatype: CreateOrderDto })).rejects.toThrow();
    }
  });
  it('validates and trims profile names', async () => {
    expect(await pipe.transform({ fullName: '  Người dùng  ' }, { type: 'body', metatype: UpdateProfileDto })).toMatchObject({ fullName: 'Người dùng' });
    for (const input of [{ fullName: ' ' }, { fullName: 123 }, { avatarUrl: 'javascript:alert(1)' }, { role: 'ADMIN' }]) await expect(pipe.transform(input, { type: 'body', metatype: UpdateProfileDto })).rejects.toThrow();
  });
  it('fingerprint is stable and changes with pricing or shipping', () => {
    const service = new PricingService({} as never);
    const serialized = service.serializeQuote(quote);
    expect(serialized.quoteFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(service.serializeQuote({ ...quote }).quoteFingerprint).toBe(serialized.quoteFingerprint);
    for (const change of [{ platformFeeRateBps: 400 }, { shippingFee: 35000n }, { pricingVersionId: 'v2' }, { subtotal: 999n }]) expect(service.serializeQuote({ ...quote, ...change }).quoteFingerprint).not.toBe(serialized.quoteFingerprint);
  });
  it('rejects stale quote before creating order or reserving product', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [{ id: 'p', seller_id: 'seller', title: 'Phone', price: '10000000' }] }) };
    const db = { transaction: async (work: (client: unknown) => unknown) => work(client) };
    const pricing = new PricingService({} as never); jest.spyOn(pricing, 'preview').mockResolvedValue(quote);
    const idempotency = { claim: jest.fn().mockResolvedValue({ scopedKey: 'key' }), complete: jest.fn() };
    const controller = new OrdersController(db as never, pricing, idempotency as never);
    await expect(controller.create({ user: { id: 'buyer' } }, { productId: 'p', quoteFingerprint: '0'.repeat(64) }, 'key')).rejects.toThrow('thay đổi');
    expect(client.query).toHaveBeenCalledTimes(1); expect(idempotency.complete).not.toHaveBeenCalled();
  });
});
