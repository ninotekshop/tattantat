import { proportionalRound } from './finance-money';
import { RefundsService } from './refunds.service';

describe('integer-VND financial arithmetic', () => {
  it('uses ROUND_HALF_UP for a 3% platform fee', () => {
    expect(proportionalRound(10_000_000n, 300n, 10_000n)).toBe(300_000n);
    expect(proportionalRound(500_000n, 300n, 10_000n)).toBe(15_000n);
    expect(proportionalRound(333_333n, 300n, 10_000n)).toBe(10_000n);
  });

  it('makes sequential partial reversal entries balance and sum to the exact full reversal', () => {
    const service = new RefundsService({} as never, {} as never, {} as never, {} as never);
    const entries = [
      { account_code: 'CASH_CLEARING', amount: '100', user_id: null, order_id: 'order-1' },
      { account_code: 'PLATFORM_REVENUE', amount: '-3', user_id: null, order_id: 'order-1' },
      { account_code: 'SELLER_PAYABLE', amount: '-97', user_id: 'seller-1', order_id: 'order-1' },
    ];
    const reverse = (service as unknown as {
      reversalLines: (source: typeof entries, before: bigint, after: bigint, total: bigint) => Array<{ accountCode: string; amount: bigint }>;
    }).reversalLines.bind(service);

    const first = reverse(entries, 0n, 50n, 100n);
    const second = reverse(entries, 50n, 100n, 100n);
    expect(first.reduce((total, line) => total + line.amount, 0n)).toBe(0n);
    expect(second.reduce((total, line) => total + line.amount, 0n)).toBe(0n);

    const totals = [...first, ...second].reduce<Record<string, bigint>>((result, line) => {
      result[line.accountCode] = (result[line.accountCode] ?? 0n) + line.amount;
      return result;
    }, {});
    expect(totals.CASH_CLEARING).toBe(-100n);
    expect(totals.PLATFORM_REVENUE).toBe(3n);
    expect(totals.SELLER_PAYABLE).toBe(97n);
  });
});
