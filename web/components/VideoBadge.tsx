import { Video } from 'lucide-react';

/** Biểu tượng nhỏ báo tin đăng có video clip (đặt trong khung ảnh có position: relative). */
export function VideoBadge({ show, size = 12 }: { show?: boolean; size?: number }) {
  if (!show) return null;
  return (
    <span title="Tin đăng có video" aria-label="Tin đăng có video" role="img"
      style={{ position: 'absolute', left: 8, bottom: 8, zIndex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size + 12, height: size + 8, borderRadius: 6, background: 'rgba(0,0,0,.65)', color: '#fff', pointerEvents: 'none' }}>
      <Video size={size} strokeWidth={2.4} />
    </span>
  );
}
