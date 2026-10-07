/** Quy đổi TTTCoin. Số tiền thanh toán đã gồm VAT 8%; 1 TTTCoin = 1 đồng giá trị dịch vụ trước VAT. */
export const VAT_RATE_PERCENT = 8;
export const MIN_DEPOSIT_VND = 10_000;
export const MAX_DEPOSIT_VND = 50_000_000;

export interface CoinQuote { amount: number; amountBeforeVat: number; vatRate: number; vatAmount: number; coinAmount: number }

/** TTTCoin = ROUND(amount / 1.08), tính bằng số nguyên để không sai số dấu phẩy động. */
export function coinFromVnd(amountVnd: number): number {
  if (!Number.isSafeInteger(amountVnd) || amountVnd < 0) throw new RangeError('Số tiền không hợp lệ');
  return Math.floor((amountVnd * 100 + 54) / 108); // làm tròn nửa lên: (a*100/108) + 0.5
}

export function quoteDeposit(amountVnd: number): CoinQuote {
  const coinAmount = coinFromVnd(amountVnd);
  return { amount: amountVnd, amountBeforeVat: coinAmount, vatRate: VAT_RATE_PERCENT, vatAmount: amountVnd - coinAmount, coinAmount };
}

/** Số tiền (VND) nhỏ nhất, làm tròn lên 1.000đ, để nhận được ít nhất `coin` TTTCoin. Dùng gợi ý nạp khi thiếu Coin. */
export function vndNeededForCoin(coin: number): number {
  if (!Number.isSafeInteger(coin) || coin <= 0) return MIN_DEPOSIT_VND;
  let vnd = Math.ceil((coin * 1.08) / 1000) * 1000;
  while (coinFromVnd(vnd) < coin) vnd += 1000;
  return Math.max(MIN_DEPOSIT_VND, vnd);
}

export function assertDepositAmount(amount: unknown): number {
  const n = Number(amount);
  if (!Number.isInteger(n) || n < MIN_DEPOSIT_VND || n > MAX_DEPOSIT_VND) {
    throw new RangeError(`Số tiền nạp từ ${MIN_DEPOSIT_VND.toLocaleString('vi-VN')}đ đến ${MAX_DEPOSIT_VND.toLocaleString('vi-VN')}đ.`);
  }
  return n;
}
