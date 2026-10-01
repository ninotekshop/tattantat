'use client';
import { Stars } from '../../reviews/Stars';
import { Ic } from '../../Ic';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import '../../../app/goi-dich-vu/billing.css';

type Row = { kind: 'seller' | 'buyer'; id: string; order_id: string; rating: number; comment: string | null; reply: string | null; status: string; created_at: string; target_name: string; author_name: string; reports: number };
const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #dce6e0', borderRadius: 8, fontSize: 13 };

export function ReviewsAdmin({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [rows, setRows] = useState<Row[]>([]); const [status, setStatus] = useState('REPORTED'); const [kind, setKind] = useState(''); const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState('');
  const call = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(`/api/v1${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) }, cache: 'no-store' });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.success) throw new Error(Array.isArray(j?.message) ? j.message.join('. ') : j?.message || 'Thao tác không thành công.');
    return j;
  }, [authHeaders]);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { const p = new URLSearchParams({ page: String(page) }); if (status) p.set('status', status); if (kind) p.set('kind', kind); setRows((await call(`/admin/reviews?${p}`)).data); }
    catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }, [call, page, status, kind]);
  useEffect(() => { void load(); }, [load]);
  async function act(r: Row, what: 'hide' | 'show') {
    if (what === 'hide' && !window.confirm('Ẩn đánh giá này khỏi hồ sơ công khai?')) return;
    setBusy(true); setError(''); setOk('');
    try { setOk((await call(`/admin/reviews/${r.kind}/${r.id}/${what}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).message); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  return <div className="bl" style={{ padding: 0 }}>
    {error && <div className="bl-msg err">{error}</div>}{ok && <div className="bl-msg ok">{ok}</div>}
    <div className="bl-card">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={inp}><option value="REPORTED">Đang bị báo cáo</option><option value="">Tất cả</option><option value="HIDDEN">Đã ẩn</option></select>
        <select value={kind} onChange={e => { setKind(e.target.value); setPage(1); }} style={inp}><option value="">Cả hai chiều</option><option value="seller">Đánh giá người bán</option><option value="buyer">Đánh giá người mua</option></select>
        <button className="bl-btn sm" disabled={busy} onClick={() => void load()}>Tải lại</button>
      </div>
      <div style={{ overflowX: 'auto' }}><table className="bl-tbl"><thead><tr><th>Loại</th><th>Người đánh giá → Được đánh giá</th><th>Sao</th><th>Nội dung</th><th>Báo cáo</th><th>Trạng thái</th><th></th></tr></thead><tbody>
        {rows.map(r => <tr key={`${r.kind}-${r.id}`}>
          <td>{r.kind === 'seller' ? 'Về người bán' : 'Về người mua'}</td><td>{r.author_name} → <b>{r.target_name}</b></td><td style={{ color: '#f5a623', whiteSpace: 'nowrap' }}><Stars value={r.rating} size={14} /></td>
          <td style={{ maxWidth: 280 }}>{r.comment ?? <i style={{ color: '#71817b' }}>Không nhận xét</i>}{r.reply && <div style={{ color: '#71817b', fontSize: 12 }}>Phản hồi: {r.reply}</div>}</td>
          <td>{r.reports > 0 ? <b style={{ color: '#b0402b' }}>{r.reports}</b> : 0}</td><td>{r.status === 'HIDDEN' ? 'Đã ẩn' : 'Hiển thị'}</td>
          <td>{r.status === 'HIDDEN' ? <button className="bl-btn sm" disabled={busy} onClick={() => void act(r, 'show')}>Hiện lại</button> : <button className="bl-btn sm" style={{ color: '#b53434', borderColor: '#f0cfc9' }} disabled={busy} onClick={() => void act(r, 'hide')}>Ẩn</button>}</td></tr>)}
        {!rows.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#71817b', padding: 24 }}>{busy ? 'Đang tải…' : 'Không có đánh giá nào.'}</td></tr>}
      </tbody></table></div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, alignItems: 'center' }}><button className="bl-btn sm" disabled={page <= 1 || busy} onClick={() => setPage(p => p - 1)}><Ic i={ArrowLeft}/>Trước</button><span style={{ fontSize: 13 }}>Trang {page}</span><button className="bl-btn sm" disabled={rows.length < 20 || busy} onClick={() => setPage(p => p + 1)}>Sau <Ic i={ArrowRight} after/></button></div>
    </div>
  </div>;
}
