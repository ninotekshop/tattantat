export type Channel = 'push' | 'email';
export type Category = 'orders' | 'account' | 'messages' | 'listings' | 'alerts' | 'billing';
export const CATEGORIES: { key: Category; label: string; help: string }[] = [
  { key: 'orders', label: 'Đơn hàng & thanh toán', help: 'Đơn mới, thanh toán, giao hàng, hoàn tiền, khiếu nại, rút tiền' },
  { key: 'account', label: 'Tài khoản & bảo mật', help: 'Xác minh, đánh giá nhận được, thay đổi quan trọng' },
  { key: 'messages', label: 'Tin nhắn', help: 'Có người nhắn tin cho bạn' },
  { key: 'listings', label: 'Tin đăng', help: 'Kết quả duyệt tin, tin bị ẩn hoặc từ chối' },
  { key: 'alerts', label: 'Tìm kiếm đã lưu', help: 'Có tin mới khớp tìm kiếm bạn đã lưu' },
  { key: 'billing', label: 'Gói dịch vụ & quảng cáo', help: 'Sắp hết hạn, gia hạn, quảng cáo' },
];
export type Prefs = Record<Channel, Partial<Record<Category, boolean>>>;
/** Mặc định: thông báo đẩy bật hết; email chỉ cho việc quan trọng (đơn hàng, tài khoản, gói dịch vụ). */
export const DEFAULT_PREFS: Prefs = {
  push: { orders: true, account: true, messages: true, listings: true, alerts: true, billing: true },
  email: { orders: true, account: true, messages: false, listings: false, alerts: false, billing: true },
};
export function categoryOf(type: string): Category | null {
  if (type.startsWith('ADMIN_')) return null; // thông báo nội bộ cho quản trị viên chỉ hiện trong ứng dụng
  if (/^(ORDER_|PAYOUT_|DISPUTE|REFUND)/.test(type)) return 'orders';
  if (/^(ACCOUNT_|IDENTITY_|REVIEW_)/.test(type)) return 'account';
  if (/^CHAT_|^MESSAGE/.test(type)) return 'messages';
  if (/^LISTING_/.test(type)) return 'listings';
  if (type === 'SAVED_SEARCH') return 'alerts';
  if (/^(SUBSCRIPTION_|PROMOTION_|AD_|ADVERTISING)/.test(type)) return 'billing';
  return 'account';
}
export function mergePrefs(stored: unknown): Prefs {
  const s = (stored && typeof stored === 'object' ? stored : {}) as Partial<Record<Channel, Record<string, unknown>>>;
  const out: Prefs = { push: { ...DEFAULT_PREFS.push }, email: { ...DEFAULT_PREFS.email } };
  for (const ch of ['push', 'email'] as Channel[]) for (const c of CATEGORIES) { const v = s[ch]?.[c.key]; if (typeof v === 'boolean') out[ch][c.key] = v; }
  return out;
}
export function sanitizePrefs(input: unknown): Prefs {
  if (!input || typeof input !== 'object') throw new Error('invalid');
  return mergePrefs(input);
}
/** Email quan trọng luôn gửi cho các loại liên quan đến tiền/bảo mật, trừ khi người dùng tắt cả nhóm. */
export const allowed = (p: Prefs, channel: Channel, category: Category | null) => category !== null && p[channel][category] !== false;
