import { BadRequestException, ConflictException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { assertDepositAmount, coinFromVnd, quoteDeposit, vndNeededForCoin } from './coin';

describe('quy đổi TTTCoin', () => {
  it.each([
    [10_000, 9_259], [50_000, 46_296], [100_000, 92_593], [200_000, 185_185], [500_000, 462_963], [1_000_000, 925_926],
  ])('%i đ → %i TTTCoin', (vnd, coin) => { expect(coinFromVnd(vnd)).toBe(coin); });

  it('tách VAT 8% từ giá đã gồm VAT', () => {
    expect(quoteDeposit(100_000)).toEqual({ amount: 100_000, amountBeforeVat: 92_593, vatRate: 8, vatAmount: 7_407, coinAmount: 92_593 });
  });
  it('số tiền nạp phải hợp lệ', () => {
    expect(() => assertDepositAmount(9_999)).toThrow();
    expect(() => assertDepositAmount(50_000_001)).toThrow();
    expect(() => assertDepositAmount(1.5)).toThrow();
    expect(assertDepositAmount(10_000)).toBe(10_000);
  });
  it('gợi ý số tiền nạp đủ để mua gói còn thiếu', () => {
    for (const missing of [55_000, 100_000, 1, 999_999]) expect(coinFromVnd(vndNeededForCoin(missing))).toBeGreaterThanOrEqual(missing);
    expect(vndNeededForCoin(55_000)).toBe(60_000);
  });
});

type Row = Record<string, any>;
function make(state: { topup: Row | null; balance: bigint }) {
  const calls: { sql: string; params?: unknown[] }[] = [];
  const ledger: { type: string; amount: string; refType: string | null; note: string; ip: string | null }[] = [];
  const handler = (sql: string, params?: unknown[]) => {
    calls.push({ sql, params });
    if (sql.includes('FROM topup_requests') && sql.includes('FOR UPDATE')) return { rows: state.topup ? [state.topup] : [] };
    if (sql.includes('INSERT INTO credit_accounts')) return { rows: [] };
    if (sql.includes('SELECT balance::text FROM credit_accounts')) return { rows: [{ balance: state.balance.toString() }] };
    if (sql.includes('UPDATE credit_accounts SET balance')) { state.balance = BigInt(params![1] as string); return { rows: [] }; }
    if (sql.includes('INSERT INTO credit_transactions')) { const p = params as any[]; ledger.push({ type: p[1], amount: p[2], refType: p[4], note: p[6], ip: p[8] }); return { rows: [] }; }
    if (sql.includes('UPDATE topup_requests SET status')) { if (state.topup) state.topup.status = sql.includes("'CONFIRMED'") ? 'CONFIRMED' : sql.includes("'REFUNDED'") ? 'REFUNDED' : state.topup.status; return { rows: [] }; }
    if (sql.includes('SELECT 1 FROM users')) return { rows: [{}] };
    return { rows: [] };
  };
  const client = { query: jest.fn(async (s: string, p?: unknown[]) => handler(s, p)) };
  const db: any = { transaction: jest.fn(async (fn: any) => fn(client)), query: jest.fn(async (s: string, p?: unknown[]) => handler(s, p)) };
  const notifications: any = { create: jest.fn().mockResolvedValue(undefined) };
  const svc = new BillingService(db, {} as any, {} as any, notifications);
  return { svc, state, ledger, calls };
}
const pending = (extra: Row = {}) => ({ id: 't1', user_id: 'u1', amount: '100000', code: 'TTTABC', status: 'PENDING', ...extra });
const paid = (amount: number, status: 'PAID' | 'FAILED' = 'PAID') => ({ providerCode: 1, status, amount } as any);

describe('nạp TTTCoin (webhook)', () => {
  it('thanh toán thành công → cộng đúng Coin và ghi sổ cái CREDIT', async () => {
    const { svc, state, ledger } = make({ topup: pending(), balance: 0n });
    await svc.settleGatewayTopup(paid(100_000));
    expect(state.balance).toBe(92_593n);
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({ type: 'TOPUP', amount: '92593', refType: 'TOPUP_REQUEST' });
  });
  it('500.000đ → 462.963 và 1.000.000đ → 925.926 TTTCoin', async () => {
    for (const [vnd, coin] of [[500_000, 462_963n], [1_000_000, 925_926n]] as const) {
      const { svc, state } = make({ topup: pending({ amount: String(vnd) }), balance: 0n });
      await svc.settleGatewayTopup(paid(vnd));
      expect(state.balance).toBe(coin);
    }
  });
  it('webhook gửi 2 lần → chỉ cộng một lần', async () => {
    const { svc, state, ledger } = make({ topup: pending(), balance: 0n });
    await svc.settleGatewayTopup(paid(100_000));
    await svc.settleGatewayTopup(paid(100_000));
    expect(state.balance).toBe(92_593n);
    expect(ledger).toHaveLength(1);
  });
  it('thanh toán thất bại/hủy → không cộng Coin', async () => {
    const { svc, state, ledger } = make({ topup: pending(), balance: 0n });
    await svc.settleGatewayTopup(paid(100_000, 'FAILED'));
    expect(state.balance).toBe(0n);
    expect(ledger).toHaveLength(0);
  });
  it('coin do client gửi không có tác dụng: backend tự tính từ số tiền thực nhận', async () => {
    const { svc, state } = make({ topup: pending(), balance: 0n });
    await svc.settleGatewayTopup({ ...paid(100_000), coinAmount: 999_999_999 } as any);
    expect(state.balance).toBe(92_593n);
  });
});

describe('điều chỉnh và hoàn nạp', () => {
  it('Admin CREDIT ghi sổ cái đúng, kèm IP', async () => {
    const { svc, state, ledger } = make({ topup: null, balance: 1_000n });
    await svc.adjustCredit('admin1', '11111111-1111-4111-8111-111111111111', 5_000, 'Tặng thưởng', '1.2.3.4');
    expect(state.balance).toBe(6_000n);
    expect(ledger[0]).toMatchObject({ type: 'ADJUST', amount: '5000', refType: 'ADMIN_ADJUSTMENT', ip: '1.2.3.4' });
  });
  it('Admin DEBIT trừ đúng và không cho âm số dư', async () => {
    const a = make({ topup: null, balance: 10_000n });
    await a.svc.adjustCredit('admin1', '11111111-1111-4111-8111-111111111111', -4_000, 'Điều chỉnh sai');
    expect(a.state.balance).toBe(6_000n);
    expect(a.ledger[0].amount).toBe('-4000');
    const b = make({ topup: null, balance: 1_000n });
    await expect(b.svc.adjustCredit('admin1', '11111111-1111-4111-8111-111111111111', -5_000, 'Trừ quá')).rejects.toThrow(BadRequestException);
    expect(b.state.balance).toBe(1_000n);
  });
  it('hoàn nạp thu hồi đúng Coin và ghi sổ cái REFUND', async () => {
    const { svc, state, ledger } = make({ topup: pending({ status: 'CONFIRMED', coin: '92593' }), balance: 92_593n });
    await svc.refundTopup('admin1', 't1', 'Khách yêu cầu hoàn', '9.9.9.9');
    expect(state.balance).toBe(0n);
    expect(ledger[0]).toMatchObject({ type: 'REFUND', amount: '-92593' });
    expect(state.topup!.status).toBe('REFUNDED');
  });
  it('không hoàn nếu thành viên đã tiêu Coin, hoặc giao dịch chưa thành công', async () => {
    const spent = make({ topup: pending({ status: 'CONFIRMED', coin: '92593' }), balance: 1_000n });
    await expect(spent.svc.refundTopup('admin1', 't1', 'Hoàn tiền')).rejects.toThrow(BadRequestException);
    const notPaid = make({ topup: pending(), balance: 0n });
    await expect(notPaid.svc.refundTopup('admin1', 't1', 'Hoàn tiền')).rejects.toThrow(ConflictException);
  });
});

describe('không đủ TTTCoin', () => {
  it('lỗi kèm số thiếu và số tiền nạp gợi ý, số dư không đổi', async () => {
    const { svc, state } = make({ topup: null, balance: 45_000n });
    let err: any;
    try { await (svc as any).move({ query: async (s: string, p?: unknown[]) => (s.includes('SELECT balance') ? { rows: [{ balance: '45000' }] } : { rows: [] }) }, 'u1', -100_000n, 'SPEND', 'SUBSCRIPTION_ORDER', null, 'Mua gói'); } catch (e) { err = e; }
    expect(err).toBeInstanceOf(BadRequestException);
    const body = err.getResponse();
    expect(body.errorCode).toBe('INSUFFICIENT_BALANCE');
    expect(body.message).toContain('nạp thêm 55.000 TTTCoin');
    expect(body.data).toMatchObject({ missing: '55000', balance: '45000', price: '100000', suggestedAmount: 60_000 });
    expect(state.balance).toBe(45_000n);
  });
});
