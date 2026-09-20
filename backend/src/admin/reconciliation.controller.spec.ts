import { ReconciliationController } from './reconciliation.controller';

describe('ReconciliationController', () => {
  it('marks a finalized journal with fewer than two entries as a reconciliation error', async () => {
    const db = { query: jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'journal-1', entry_count: 1, balance: '0' }] })
      .mockResolvedValueOnce({ rows: [{ finalized_transactions: 1, total_debits: '0', total_credits: '0' }] }) };
    const controller = new ReconciliationController(db as never);

    await expect(controller.check()).resolves.toEqual({
      success: true,
      data: {
        balanced: false,
        checked: { finalized_transactions: 1, total_debits: '0', total_credits: '0' },
        errors: [{ id: 'journal-1', entry_count: 1, balance: '0' }],
      },
      message: null,
      errorCode: null,
    });
  });
});
