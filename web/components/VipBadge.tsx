/** Nhãn VIP trên thẻ tin (đặt trong khung ảnh có position: relative). */
export function VipBadge({ show }: { show?: boolean }) {
  if (!show) return null;
  return <span title="Tin VIP nổi bật" style={{ position: 'absolute', left: 8, top: 8, zIndex: 2, background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: .5, padding: '3px 8px', borderRadius: 6, pointerEvents: 'none' }}>VIP</span>;
}
