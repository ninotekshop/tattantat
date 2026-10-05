export function vnd(price?: string | number | null, mode?: string | null) {
  if (mode === 'CONTACT') return 'Liên hệ';
  if (mode === 'FREE') return 'Cho tặng';
  const n = Number(price ?? 0);
  if (!n) return 'Liên hệ';
  const unit = ({ HOUR: '/giờ', DAY: '/ngày', MONTH: '/tháng', M2: '/m²' } as Record<string, string>)[mode ?? ''] ?? '';
  return n.toLocaleString('vi-VN') + ' đ' + unit;
}
export function timeAgo(iso?: string | null) {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'Vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}
export const initials = (name?: string | null) => (name ?? '?').trim().split(/\s+/).slice(-2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
