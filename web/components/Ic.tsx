import type { LucideIcon } from 'lucide-react';

/** Icon nào mang nghĩa cảnh báo/nguy hiểm/VIP thì giữ màu theo ngữ cảnh, không ép xanh. */
const KEEP_COLOR = new Set(['TriangleAlert', 'AlertTriangle', 'Trash2', 'Crown', 'Flame', 'OctagonAlert', 'CircleAlert', 'ShieldAlert', 'Ban', 'Star']);

const BRAND = 'var(--brand, #00a65a)';
/** Icon "xác nhận" vẽ đặc: nền xanh thương hiệu, dấu tích trắng. */
const SOLID: Record<string, { shape: string; check: string; circle?: boolean }> = {
  BadgeCheck: { shape: 'M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.74Z', check: 'm9 12 2 2 4-4' },
  ShieldCheck: { shape: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', check: 'm9 12 2 2 4-4' },
  CircleCheck: { shape: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', check: 'm9 12 2 2 4-4', circle: true },
  CheckCircle: { shape: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', check: 'm9 12 2 2 4-4', circle: true },
  CheckCircle2: { shape: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', check: 'm9 12 2 2 4-4', circle: true },
};

/**
 * Icon Lucide đặt cạnh chữ (thay cho emoji).
 * - Icon "xác nhận" (BadgeCheck, ShieldCheck, CircleCheck…) hiện đặc: nền xanh, dấu tích trắng.
 * - `solid`: bất kỳ icon nào cũng hiện trong chip tròn xanh, ký hiệu trắng (vd. chuông Lưu tìm kiếm).
 * - Còn lại: nét outline xanh thương hiệu. `tone="inherit"` để theo màu chữ cha (icon nằm trên nền màu).
 */
export function Ic({ i: Icon, size = '1.1em', after = false, fill, tone, solid, style }: { i: LucideIcon; size?: number | string; after?: boolean; fill?: string; tone?: 'brand' | 'inherit'; solid?: boolean; style?: React.CSSProperties }) {
  const name = (Icon as any).displayName || '';
  const inherit = tone ? tone === 'inherit' : KEEP_COLOR.has(name);
  const box: React.CSSProperties = { display: 'inline-block', verticalAlign: '-0.18em', flex: 'none', [after ? 'marginLeft' : 'marginRight']: '0.35em', ...style };
  const s = SOLID[name];
  if (s && !inherit && !fill) {
    return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={box}>
      <path d={s.shape} fill={BRAND} stroke={BRAND} strokeWidth={s.circle ? 0 : 1.5} strokeLinejoin="round" />
      <path d={s.check} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
  }
  if (solid) {
    return <span aria-hidden="true" style={{ ...box, width: '1.45em', height: '1.45em', borderRadius: '50%', background: BRAND, display: 'inline-grid', placeItems: 'center', verticalAlign: '-0.3em' }}>
      <Icon size="0.9em" strokeWidth={2.2} style={{ color: '#fff', margin: 0 }} />
    </span>;
  }
  return <Icon size={size} strokeWidth={2} fill={fill ?? 'none'} aria-hidden="true" style={{ ...box, ...(inherit ? { color: 'inherit' } : {}) }} />;
}
