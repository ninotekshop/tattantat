import { ConflictException } from '@nestjs/common';
import { LedgerWriterService } from './ledger-writer.service';

describe('LedgerWriterService', () => {
  it('rejects an unbalanced transaction before writing any entry', async () => {
    const client = { query: jest.fn() };
    const service = new LedgerWriterService();
    await expect(service.finalize(client as never, 'tx-1', [
      { accountCode: 'CASH_CLEARING', amount: 100n },
      { accountCode: 'SELLER_PAYABLE', amount: -90n },
    ])).rejects.toThrow('not balanced');
    expect(client.query).not.toHaveBeenCalled();
  });

  it('writes and finalizes balanced entries exactly once', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ status: 'PENDING' }] })
        .mockResolvedValue({ rowCount: 1, rows: [] }),
    };
    const service = new LedgerWriterService();
    await service.finalize(client as never, 'tx-2', [
      { accountCode: 'CASH_CLEARING', amount: 100n, orderId: 'order-1' },
      { accountCode: 'SELLER_PAYABLE', amount: -97n, userId: 'seller-1', orderId: 'order-1' },
      { accountCode: 'PLATFORM_REVENUE', amount: -3n, orderId: 'order-1' },
    ]);
    expect(client.query).toHaveBeenCalledTimes(5);
    expect(client.query.mock.calls.at(-1)?.[0]).toContain("status='FINALIZED'");
  });

  it('does not mutate an already finalized ledger transaction', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [{ status: 'FINALIZED' }] }) };
    const service = new LedgerWriterService();
    await service.finalize(client as never, 'tx-3', [
      { accountCode: 'CASH_CLEARING', amount: 1n }, { accountCode: 'PLATFORM_REVENUE', amount: -1n },
    ]);
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it('rejects finalized state transitions other than pending', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [{ status: 'REVERSED' }] }) };
    const service = new LedgerWriterService();
    await expect(service.finalize(client as never, 'tx-4', [
      { accountCode: 'CASH_CLEARING', amount: 1n }, { accountCode: 'PLATFORM_REVENUE', amount: -1n },
    ])).rejects.toBeInstanceOf(ConflictException);
  });
});
