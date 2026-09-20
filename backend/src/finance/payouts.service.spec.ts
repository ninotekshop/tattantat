import { BadRequestException } from '@nestjs/common';
import { PayoutsService } from './payouts.service';

describe('PayoutsService', () => {
  it('rejects a payout above available balance before creating financial side effects', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 'bank-1' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ pending_balance: '0', available_balance: '999', held_balance: '0' }] }),
    };
    const db = { transaction: jest.fn((work: (value: unknown) => unknown) => work(client)) };
    const idempotency = { claim: jest.fn().mockResolvedValue({ scopedKey: 'seller-payout:seller-1:key-1' }) };
    const service = new PayoutsService(db as never, idempotency as never, {} as never, {} as never);

    await expect(service.request('seller-1', { amount: '1000', bankAccountId: 'bank-1' }, 'key-1'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(client.query).toHaveBeenCalledTimes(3);
  });
});
