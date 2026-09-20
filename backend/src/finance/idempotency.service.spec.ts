import { BadRequestException, ConflictException } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService', () => {
  const service = new IdempotencyService();

  it('claims a new scoped key once', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rowCount: 1, rows: [] }) };
    const claim = await service.claim(client as never, 'payment-create', 'buyer-1', 'request-1', { orderId: 'order-1' });
    expect(claim.scopedKey).toBe('payment-create:buyer-1:request-1');
    expect(claim.replay).toBeUndefined();
  });

  it('replays the saved response instead of creating a second financial action', async () => {
    const saved = { success: true, data: { paymentId: 'pay-1' } };
    const client = { query: jest.fn() };
    const hash = require('crypto').createHash('sha256').update(JSON.stringify({ scope: 'payment-create', actorId: 'buyer-1', request: { orderId: 'order-1' } })).digest('hex');
    client.query.mockResolvedValueOnce({ rowCount: 0, rows: [] }).mockResolvedValueOnce({ rows: [{ request_hash: hash, response: saved }] });
    const claim = await service.claim<typeof saved>(client as never, 'payment-create', 'buyer-1', 'request-1', { orderId: 'order-1' });
    expect(claim.replay).toEqual(saved);
  });

  it('rejects reuse of a key for a different request payload', async () => {
    const client = { query: jest.fn()
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rows: [{ request_hash: 'different-hash', response: null }] }) };
    await expect(service.claim(client as never, 'seller-payout', 'seller-1', 'same-key', { amount: '1000' }))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('requires a safe idempotency key', async () => {
    const client = { query: jest.fn() };
    await expect(service.claim(client as never, 'payment-create', 'buyer-1', undefined, {})).rejects.toBeInstanceOf(BadRequestException);
  });
});
