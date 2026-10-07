'use client';

import { useState } from 'react';
import { readSession } from '../../lib/auth';

type Criterion = { key: string; label: string; completed: boolean; points: number; maxPoints: number };
type Detail = { score: number; maxScore: number; stars: number; level: string; criteria: Criterion[]; history?: { old_score: number | null; new_score: number; reason: string; created_at: string }[] };

/** Cột "Điểm uy tín" trong bảng thành viên (chỉ đọc). Bấm để xem nguồn điểm; admin không sửa được điểm. */
export function AdminTrustCell({ userId, score, stars }: { userId: string; score?: number | null; stars?: number | null }) {
  const [open, setOpen] = useState(false);
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState('');

  const show = async () => {
    setOpen(true); setErr(''); setD(null);
    try {
      const token = readSession()?.accessToken;
      const r = await fetch(`/api/v1/admin/users/${encodeURIComponent(userId)}/trust-score`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const j = await r.json();
      if (j?.success) setD(j.data as Detail); else setErr(j?.message || 'Không tải được điểm uy tín.');
    } catch { setErr('Không tải được điểm uy tín.'); }
  };

  const n = stars ?? 1;
  return (
    <>
      <button type="button" onClick={show} title="Xem nguồn điểm" style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 0, font: 'inherit', textAlign: 'left' }}>
        <span style={{ color: '#f5a623', letterSpacing: 1 }}>{'★'.repeat(n)}<span style={{ color: '#d6dbd8' }}>{'★'.repeat(5 - n)}</span></span>
        <div style={{ fontSize: 12, fontWeight: 700 }}>{score == null ? 'Chưa tính' : `${score}/10`}</div>
      </button>
      {open && (
        <div role="dialog" aria-modal="true" onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,.5)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: 'min(400px,100%)', maxHeight: '90vh', overflow: 'auto', padding: 20 }}>
            <h3 style={{ margin: '0 0 4px' }}>Điểm uy tín {d ? `${d.score}/${d.maxScore}` : ''}</h3>
            {d && <div style={{ fontSize: 13, color: '#007c4b', fontWeight: 600, marginBottom: 10 }}>{d.level}</div>}
            {err && <p style={{ color: '#e11d48' }}>{err}</p>}
            {!d && !err && <p>Đang tải…</p>}
            {d && (
              <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                <tbody>
                  {d.criteria.map(c => (
                    <tr key={c.key} style={{ borderBottom: '1px solid #eef2ef' }}>
                      <td style={{ padding: '6px 0' }}>{c.label}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: c.completed ? '#00733e' : '#94a3b8' }}>{c.points}/{c.maxPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {d?.history && d.history.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                <b>Lịch sử thay đổi</b>
                {d.history.map((h, i) => <div key={i}>{h.old_score ?? '–'} → {h.new_score} · {h.reason} · {new Date(h.created_at).toLocaleDateString('vi-VN')}</div>)}
              </div>
            )}
            <p style={{ fontSize: 12, color: '#64748b', margin: '12px 0 0' }}>Điểm được tính tự động từ dữ liệu thực tế, quản trị viên không chỉnh sửa trực tiếp.</p>
            <button type="button" onClick={() => setOpen(false)} style={{ marginTop: 12, width: '100%', border: 0, borderRadius: 8, padding: '10px 0', background: '#00a65a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Đóng</button>
          </div>
        </div>
      )}
    </>
  );
}
