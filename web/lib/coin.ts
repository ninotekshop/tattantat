/** Quy đổi TTTCoin (bản hiển thị; backend là nguồn quyết định số Coin thực tế). */
export const VAT_RATE_PERCENT = 8;
export const MIN_DEPOSIT = 10_000;
export const MAX_DEPOSIT = 50_000_000;

export const coinFromVnd = (amountVnd: number) => (Number.isSafeInteger(amountVnd) && amountVnd > 0 ? Math.floor((amountVnd * 100 + 54) / 108) : 0);
export function previewDeposit(amountVnd: number) {
  const coinAmount = coinFromVnd(amountVnd);
  return { amount: amountVnd, amountBeforeVat: coinAmount, vatAmount: Math.max(0, amountVnd - coinAmount), coinAmount };
}
/** Số tiền nhỏ nhất (làm tròn 1.000đ) để nhận ít nhất `coin` TTTCoin. */
export function vndNeededForCoin(coin: number) {
  if (!Number.isSafeInteger(coin) || coin <= 0) return MIN_DEPOSIT;
  let vnd = Math.ceil((coin * 1.08) / 1000) * 1000;
  while (coinFromVnd(vnd) < coin) vnd += 1000;
  return Math.max(MIN_DEPOSIT, vnd);
}
export const coin = (value: string | number | null | undefined) => (Number(value ?? 0) || 0).toLocaleString('vi-VN') + ' TTTCoin';
export const COIN_NOTE = 'TTTCoin là đơn vị tín dụng nội bộ của Tất Tần Tật, được sử dụng để thanh toán các gói và dịch vụ trên nền tảng.';
export const COIN_TERMS = [
  'TTTCoin là đơn vị tín dụng nội bộ trên nền tảng Tất Tần Tật, không phải tiền tệ.',
  'TTTCoin được dùng để mua các gói/dịch vụ được hỗ trợ.',
  'Không chuyển TTTCoin giữa các tài khoản ở phiên bản hiện tại.',
  'Không tự động quy đổi TTTCoin ngược thành tiền mặt.',
  'Việc hoàn/hủy giao dịch tuân theo chính sách của Tất Tần Tật. Số tiền thanh toán đã bao gồm VAT 8%.',
];
