export type Notice = { id: string; type: string; title: string; content: string; reference_type: string | null; reference_id: string | null; is_read: boolean; created_at: string };
export type NoticeGroup = 'all' | 'listing' | 'transaction' | 'messages' | 'system';
export const GROUPS: { key: NoticeGroup; label: string }[] = [
  { key: 'all', label: 'Tất cả' }, { key: 'listing', label: 'Tin đăng' }, { key: 'transaction', label: 'Giao dịch' }, { key: 'messages', label: 'Tin nhắn' }, { key: 'system', label: 'Từ Tất Tần Tật' },
];
export function groupOf(type: string): Exclude<NoticeGroup, 'all'> {
  if (type === 'CHAT_MESSAGE') return 'messages';
  if (type.startsWith('LISTING_')) return 'listing';
  if (type.startsWith('ADMIN_') || type.startsWith('ACCOUNT_') || type.startsWith('SYSTEM_')) return 'system';
  return 'transaction';
}
export const GROUP_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  listing: { bg: '#e6f6ed', fg: '#0a8a55', label: 'Tin đăng' },
  transaction: { bg: '#fff3d6', fg: '#8a6410', label: 'Giao dịch' },
  messages: { bg: '#e8eefc', fg: '#3556a8', label: 'Tin nhắn' },
  system: { bg: '#fde8f0', fg: '#a3315f', label: 'Hệ thống' },
};
export function noticeLink(n: Notice): string | null {
  const id = n.reference_id ? encodeURIComponent(n.reference_id) : '';
  if (n.type.startsWith('ADMIN_')) return '/adminttt';
  if (n.type === 'SAVED_SEARCH') return '/account?section=searches';
  switch (n.reference_type) {
    case 'CHAT': return id ? `/messages?chat=${id}` : '/messages';
    case 'ORDER': return '/orders';
    case 'PRODUCT': return n.type === 'LISTING_REJECTED' || n.type === 'LISTING_HIDDEN' ? '/account?section=listings' : id ? `/products/${id}` : null;
    case 'TOPUP': return '/vi-tien';
    case 'SUBSCRIPTION': return n.type.startsWith('SUBSCRIPTION_EXPIR') || n.type === 'PROMOTION_EXPIRING' ? '/goi-dich-vu' : '/vi-tien';
    case 'ADVERTISING': return '/vi-tien';
    case 'PAYOUT': case 'USER': return '/account';
    case 'ADMIN': return '/adminttt';
    default: return null;
  }
}
export function timeAgo(value: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'Vừa xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)} ngày trước`;
  return new Date(value).toLocaleDateString('vi-VN');
}
