'use client';

import { useEffect, useState } from 'react';

export type TrustCriterion = { key: string; label: string; completed: boolean; points: number; maxPoints: number };
export type TrustData = { score: number; maxScore: number; stars: number; level: string; criteria: TrustCriterion[] };

export const TRUST_TOOLTIP = 'Điểm uy tín phản ánh mức độ xác thực và hoạt động của thành viên trên Tất Tần Tật. Điểm càng cao cho thấy tài khoản đã hoàn thiện nhiều tiêu chí xác thực và có lịch sử hoạt động tốt hơn.';

const cache = new Map<string, { at: number; p: Promise<TrustData | null> }>();
function loadTrust(userId: string): Promise<TrustData | null> {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < 60_000) return hit.p;
  const p = fetch(`/api/v1/users/${encodeURIComponent(userId)}/trust-score`).then(r => r.json()).then(j => (j?.success ? (j.data as TrustData) : null)).catch(() => null);
  cache.set(userId, { at: Date.now(), p });
  return p;
}

export function Stars({ n, size = 15 }: { n: number; size?: number }) {
  return (
    <span aria-label={`${n} trên 5 sao`} style={{ letterSpacing: 1, fontSize: size, lineHeight: 1, color: '#f5a623', whiteSpace: 'nowrap' }}>
      {'★'.repeat(n)}<span style={{ color: '#d6dbd8' }}>{'★'.repeat(5 - n)}</span>
    </span>
  );
}

/**
 * Huy hiệu điểm uy tín. variant="full": sao + điểm + cấp độ; "compact": ★★★★☆ 8/10 (dùng trên mobile/chat).
 * Bấm vào để xem chi tiết tiêu chí.
 */
export default function TrustBadge({ userId, variant = 'full' }: { userId: string; variant?: 'full' | 'compact' }) {
  const [data, setData] = useState<TrustData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;
    void loadTrust(userId).then(d => { if (live) setData(d); });
    return () => { live = false; };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!data) return null;
  const compact = variant === 'compact';

  return (
    <>
      <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true); }} title={`${data.score}/${data.maxScore} điểm uy tín · ${data.level}`}
        style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: compact ? 5 : 8, border: 0, background: 'transparent', padding: 0, cursor: 'pointer', font: 'inherit', color: '#334155', textAlign: 'left' }}>
        <Stars n={data.stars} size={compact ? 13 : 16} />
        <span style={{ fontWeight: 700, fontSize: compact ? 12 : 13 }}>{data.score}/{data.maxScore}{compact ? '' : ' điểm uy tín'}</span>
        {!compact && <span style={{ fontSize: 12, color: '#007c4b', background: '#e6f6ed', borderRadius: 10, padding: '2px 9px', fontWeight: 600 }}>{data.level}</span>}
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Điểm uy tín" onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,.5)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: 'min(420px, 100%)', maxHeight: '90vh', overflow: 'auto', padding: '22px 20px 18px', boxShadow: '0 20px 50px rgba(0,0,0,.25)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 800, color: '#64748b' }}>ĐIỂM UY TÍN</div>
              <div style={{ margin: '8px 0 2px' }}><Stars n={data.stars} size={28} /></div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{data.score}/{data.maxScore}</div>
              <div style={{ fontWeight: 700, color: '#007c4b' }}>{data.level}</div>
            </div>
            <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'grid', gap: 8 }}>
              {data.criteria.map(c => (
                <li key={c.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', fontSize: 14, color: c.completed ? '#0f172a' : '#94a3b8' }}>
                  <span><b style={{ color: c.completed ? '#00a65a' : '#cbd5e1', marginRight: 8 }}>{c.completed ? '✓' : '✗'}</b>{c.label}</span>
                  <b>{c.completed ? `+${c.points}` : `0/${c.maxPoints}`}</b>
                </li>
              ))}
            </ul>
            <p style={{ margin: '16px 0 6px', fontSize: 13, color: '#334155' }}>Hoàn thiện thêm các tiêu chí để tăng mức độ uy tín của tài khoản.</p>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>{TRUST_TOOLTIP}</p>
            <button type="button" onClick={() => setOpen(false)} style={{ marginTop: 14, width: '100%', border: 0, borderRadius: 10, padding: '11px 0', background: '#00a65a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Đóng</button>
          </div>
        </div>
      )}
    </>
  );
}
