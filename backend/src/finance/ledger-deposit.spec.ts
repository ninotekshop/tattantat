import { LedgerService } from './ledger.service';

function run(order: Record<string, unknown>) {
  const finalized: { lines: { accountCode: string; amount: bigint }[] }[] = [];
  const queries: { sql: string; values?: unknown[] }[] = [];
  const client = {
    query: jest.fn(async (sql: string, values?: unknown[]) => {
      queries.push({ sql, values });
      if (sql.includes('FROM orders WHERE id=$1 FOR UPDATE')) return { rows: [order] };
      if (sql.includes("type='ORDER_PAYMENT'")) return { rows: [] };
      if (sql.includes("SET order_status='COMPLETED'")) return { rows: [{ id: 'o1' }] };
      if (sql.includes('FROM payments')) return { rows: [{ id: 'p1', provider: 'MOCK', status: 'PAID' }] };
      if (sql.includes('INSERT INTO ledger_transactions')) return { rows: [{ id: 'l1' }] };
      return { rows: [] };
    }),
  };
  const db = { transaction: async (fn: (c: typeof client) => unknown) => fn(client) };
  const writer = { finalize: jest.fn(async (_c: unknown, _id: string, lines: { accountCode: string; amount: bigint }[]) => { finalized.push({ lines }); }) };
  const svc = new LedgerService(db as never, writer as never);
  return { svc, finalized, queries };
}
const base = { id: 'o1', seller_id: 's1', product_id: 'pr', total_amount: '1000000', platform_fee_amount: '20000', payment_fee_amount: '10000', seller_payout_amount: '970000', shipping_fee_amount: '0', payment_plan: 'DEPOSIT', deposit_amount: '300000' };

describe('tất toán đơn đặt cọc', () => {
  it('ví người bán chỉ nhận cọc trừ phí, sổ cái cân bằng', async () => {
    const { svc, finalized, queries } = run(base);
    await svc.completeOrder('o1', 's1');
    const lines = finalized[0].lines;
    expect(lines.reduce((t, l) => t + l.amount, 0n)).toBe(0n);
    expect(lines.find(l => l.accountCode === 'CASH_CLEARING')?.amount).toBe(300000n);
    expect(lines.find(l => l.accountCode === 'SELLER_PAYABLE')?.amount).toBe(-270000n);
    const wallet = queries.find(q => q.sql.includes('INSERT INTO seller_wallets'));
    expect(wallet?.values).toEqual(['s1', '270000']);
  });

  it('phí không vượt quá tiền cọc đang giữ', async () => {
    const { svc, finalized } = run({ ...base, deposit_amount: '25000' });
    await svc.completeOrder('o1', 's1');
    const lines = finalized[0].lines;
    expect(lines.reduce((t, l) => t + l.amount, 0n)).toBe(0n);
    expect(lines.find(l => l.accountCode === 'SELLER_PAYABLE')).toBeUndefined();
  });

  it('đơn thanh toán đủ giữ nguyên cách ghi sổ cũ', async () => {
    const { svc, finalized } = run({ ...base, payment_plan: 'FULL', deposit_amount: null, shipping_fee_amount: '0', seller_payout_amount: '970000' });
    await svc.completeOrder('o1', 's1');
    expect(finalized[0].lines.find(l => l.accountCode === 'SELLER_PAYABLE')?.amount).toBe(-970000n);
  });
});
