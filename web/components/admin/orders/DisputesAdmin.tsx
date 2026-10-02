'use client';
import { Ic } from '../../Ic';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import '../../../app/goi-dich-vu/billing.css';
import { MoneyInput } from '../../MoneyInput';

type Row = { id: string; order_code: string; total_amount: string; order_status: string; status: string; reasonLabel: string; opened_role: string; resolution: string | null; created_at: string; buyer_name: string; seller_name: string };
type Msg = { id: string; author_role: string; author_name: string; content: string; created_at: string };
type Detail = Row & { description: string; evidence_urls: string[]; refund_amount: string | null; admin_note: string | null; payment_status: string; payment_method: string | null; product_title: string; buyer_phone: string | null; seller_phone: string | null; messages: Msg[] };
type Stats = { open: number; reviewing: number; resolved: number; overdue: number; refunded: string };

const ST: Record<string, { l: string; bg: string; fg: string }> = { OPEN: { l: 'Chờ tiếp nhận', bg: '#fff3d6', fg: '#8a6410' }, REVIEWING: { l: 'Đang xem xét', bg: '#e8eefc', fg: '#3556a8' }, RESOLVED: { l: 'Đã giải quyết', bg: '#dff3e6', fg: '#137a4a' } };
const RES: Record<string, string> = { REFUND_FULL: 'Hoàn toàn bộ cho người mua', REFUND_PARTIAL: 'Hoàn một phần', REJECT: 'Bác khiếu nại' };
const ROLE: Record<string, string> = { BUYER: 'Người mua', SELLER: 'Người bán', ADMIN: 'Quản trị viên' };
const vnd = (v: string | number | null) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;
const dt = (v: string | null) => (v ? new Date(v).toLocaleString('vi-VN', { hour12: false }) : '—');
const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #dce6e0', borderRadius: 8, fontSize: 13, minWidth: 0 };
const Badge = ({ s }: { s: string }) => { const x = ST[s] ?? { l: s, bg: '#eef3f0', fg: '#5c7267' }; return <span style={{ background: x.bg, color: x.fg, borderRadius: 10, padding: '2px 9px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{x.l}</span>; };

export function DisputesAdmin({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [rows, setRows] = useState<Row[]>([]); const [stats, setStats] = useState<Stats | null>(null); const [total, setTotal] = useState(0);
  const [status, setStatus] = useState(''); const [q, setQ] = useState(''); const [dq, setDq] = useState(''); const [page, setPage] = useState(1);
  const [d, setD] = useState<Detail | null>(null);
  const [decision, setDecision] = useState<'REFUND_FULL' | 'REFUND_PARTIAL' | 'REJECT'>('REJECT'); const [amount, setAmount] = useState(''); const [note, setNote] = useState(''); const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState('');
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 400); return () => clearTimeout(t); }, [q]);

  const call = useCallback(async <T,>(path: string, init?: RequestInit): Promise<{ data: T; meta?: { total: number }; message?: string }> => {
    const res = await fetch(`/api/v1${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) }, cache: 'no-store' });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.success) throw new Error(Array.isArray(j?.message) ? j.message.join('. ') : j?.message || 'Thao tác không thành công.');
    return j;
  }, [authHeaders]);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const p = new URLSearchParams({ page: String(page) }); if (status) p.set('status', status); if (dq) p.set('q', dq);
      const [l, s] = await Promise.all([call<Row[]>(`/admin/disputes?${p}`), call<Stats>('/admin/disputes/stats')]);
      setRows(l.data); setTotal(l.meta?.total ?? 0); setStats(s.data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }, [call, page, status, dq]);
  useEffect(() => { void load(); }, [load]);

  const open = async (id: string) => { setError(''); setOk(''); try { const r = await call<Detail>(`/admin/disputes/${id}`); setD(r.data); setDecision('REJECT'); setAmount(''); setNote(''); setMsg(''); } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được khiếu nại.'); } };
  async function act(path: string, body: unknown, after?: () => void) {
    setBusy(true); setError(''); setOk('');
    try { const r = await call(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) }); setOk(r.message ?? 'Đã thực hiện.'); after?.(); if (d) await open(d.id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  const resolve = () => {
    if (!d) return;
    const label = decision === 'REJECT' ? 'BÁC khiếu nại' : decision === 'REFUND_FULL' ? 'HOÀN TOÀN BỘ tiền cho người mua' : `HOÀN ${vnd(amount)} cho người mua`;
    if (!window.confirm(`Xác nhận ${label} — đơn ${d.order_code}? Quyết định không thể hoàn tác.`)) return;
    void act(`/admin/disputes/${d.id}/resolve`, { decision, note, ...(decision === 'REFUND_PARTIAL' ? { amount } : {}) });
  };
  const active = d && d.status !== 'RESOLVED';
  const cards: [string, string][] = stats ? [['Chờ tiếp nhận', String(stats.open)], ['Đang xem xét', String(stats.reviewing)], ['Quá 48 giờ chưa xử lý', String(stats.overdue)], ['Đã giải quyết', String(stats.resolved)], ['Tổng tiền đã hoàn', vnd(stats.refunded)]] : [];
  const pages = Math.max(1, Math.ceil(total / 20));

  return <div className="bl" style={{ padding: 0 }}>
    {error && <div className="bl-msg err">{error}</div>}{ok && <div className="bl-msg ok">{ok}</div>}
    <div className="bl-grid plans" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>{cards.map(([l, v]) => <div key={l} className="bl-card" style={{ margin: 0, padding: 14 }}><div style={{ color: '#71817b', fontSize: 12 }}>{l}</div><div style={{ fontSize: 20, fontWeight: 800, color: l.startsWith('Quá') && v !== '0' ? '#b0402b' : '#007c4b' }}>{v}</div></div>)}</div>
    <div className="bl-card">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input placeholder="Tìm mã đơn, người mua, người bán…" value={q} onChange={e => setQ(e.target.value)} style={{ ...inp, flex: 1, minWidth: 220 }} />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={inp}><option value="">Tất cả trạng thái</option>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}</select>
        <button className="bl-btn sm" disabled={busy} onClick={() => void load()}>Tải lại</button>
      </div>
      <div style={{ overflowX: 'auto' }}><table className="bl-tbl"><thead><tr><th>Đơn</th><th>Lý do</th><th>Người mua</th><th>Người bán</th><th>Giá trị</th><th>Gửi lúc</th><th>Trạng thái</th></tr></thead><tbody>
        {rows.map(r => <tr key={r.id} onClick={() => void open(r.id)} style={{ cursor: 'pointer' }}>
          <td><b>#{r.order_code}</b><div style={{ color: '#71817b', fontSize: 11 }}>{r.opened_role === 'BUYER' ? 'Người mua khiếu nại' : 'Người bán khiếu nại'}</div></td>
          <td>{r.reasonLabel}</td><td>{r.buyer_name}</td><td>{r.seller_name}</td><td style={{ fontWeight: 700 }}>{vnd(r.total_amount)}</td><td style={{ whiteSpace: 'nowrap' }}>{dt(r.created_at)}</td>
          <td><Badge s={r.status} />{r.resolution && <div style={{ color: '#71817b', fontSize: 11, marginTop: 2 }}>{RES[r.resolution]}</div>}</td></tr>)}
        {!rows.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#71817b', padding: 24 }}>{busy ? 'Đang tải…' : 'Không có khiếu nại nào.'}</td></tr>}
      </tbody></table></div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
        <button className="bl-btn sm" disabled={page <= 1 || busy} onClick={() => setPage(p => p - 1)}><Ic i={ArrowLeft}/>Trước</button><span style={{ fontSize: 13 }}>Trang {page} / {pages}</span>
        <button className="bl-btn sm" disabled={page >= pages || busy} onClick={() => setPage(p => p + 1)}>Sau <Ic i={ArrowRight} after/></button>
      </div>
    </div>

    {d && <div onClick={() => setD(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,35,28,.45)', zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
      <aside onClick={e => e.stopPropagation()} style={{ width: 'min(600px,100%)', background: '#fff', height: '100%', overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><div><h2 style={{ margin: 0, fontSize: 18 }}>Khiếu nại đơn #{d.order_code}</h2><div style={{ color: '#71817b', fontSize: 12 }}>{d.reasonLabel} · gửi {dt(d.created_at)}</div></div><div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Badge s={d.status} /><button className="bl-btn sm" onClick={() => setD(null)} aria-label="Đóng"><X size={16} aria-hidden="true" /></button></div></div>
        <div style={{ fontSize: 13, margin: '12px 0', lineHeight: 1.7 }}>
          <b>Sản phẩm:</b> {d.product_title} · <b>{vnd(d.total_amount)}</b><br />
          <b>Người mua:</b> {d.buyer_name} {d.buyer_phone ?? ''} · <b>Người bán:</b> {d.seller_name} {d.seller_phone ?? ''}<br />
          <b>Đơn:</b> {d.order_status} · <b>Thanh toán:</b> {d.payment_status} {d.payment_method ?? ''}</div>
        {d.evidence_urls?.length > 0 && <div style={{ fontSize: 13, marginBottom: 8 }}><b>Bằng chứng:</b> {d.evidence_urls.map((u, i) => <a key={i} href={u} target="_blank" rel="noopener noreferrer" style={{ marginRight: 10 }}>Tệp {i + 1}</a>)}</div>}
        <div style={{ borderTop: '1px solid #eef3ef', paddingTop: 10 }}><b style={{ fontSize: 13 }}>Trao đổi</b>
          <div style={{ display: 'grid', gap: 6, marginTop: 6, maxHeight: 280, overflowY: 'auto' }}>{d.messages.map(m => <div key={m.id} style={{ background: m.author_role === 'ADMIN' ? '#e8eefc' : '#f4f8f6', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}><b>{ROLE[m.author_role]}{m.author_role !== 'ADMIN' ? ` · ${m.author_name}` : ''}</b> <span style={{ color: '#71817b', fontSize: 11 }}>{dt(m.created_at)}</span><div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div></div>)}</div>
          {active && <div style={{ display: 'flex', gap: 6, marginTop: 8 }}><input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Nhắn cho cả hai bên…" maxLength={2000} style={{ ...inp, flex: 1 }} /><button className="bl-btn sm" disabled={busy || msg.trim().length < 2} onClick={() => void act(`/admin/disputes/${d.id}/message`, { content: msg }, () => setMsg(''))}>Gửi</button></div>}</div>
        {d.status === 'OPEN' && <button className="bl-btn sm primary" style={{ marginTop: 12 }} disabled={busy} onClick={() => void act(`/admin/disputes/${d.id}/review`, {})}>Tiếp nhận xử lý</button>}
        {active && <div style={{ borderTop: '1px solid #eef3ef', marginTop: 14, paddingTop: 12 }}><b style={{ fontSize: 13 }}>Quyết định</b>
          <div style={{ display: 'grid', gap: 6, margin: '8px 0', fontSize: 13 }}>
            {([['REJECT', 'Bác khiếu nại — giữ nguyên giao dịch, người bán được nhận tiền'], ['REFUND_FULL', 'Hoàn toàn bộ tiền cho người mua'], ['REFUND_PARTIAL', 'Hoàn một phần (chỉ khi đơn đã hoàn tất)']] as const).map(([k, l]) =>
              <label key={k} style={{ display: 'flex', gap: 8 }}><input type="radio" name="dec" checked={decision === k} onChange={() => setDecision(k)} />{l}</label>)}
          </div>
          {decision === 'REFUND_PARTIAL' && <MoneyInput placeholder="Số tiền hoàn (₫)" value={amount} onChange={d => setAmount(d)} style={{ ...inp, width: '100%', marginBottom: 8 }} />}
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Lý do quyết định (hai bên sẽ thấy, 5–1000 ký tự)" style={{ ...inp, width: '100%' }} />
          <p style={{ color: '#71817b', fontSize: 12 }}>Đơn đã hoàn tất: hệ thống ghi bút toán đảo và trừ ví người bán. Đơn chưa hoàn tất, đã thanh toán trực tuyến: đơn bị hủy và bạn cần chuyển trả tiền cho người mua qua ngân hàng/cổng thanh toán.</p>
          <button className="bl-btn primary" disabled={busy || note.trim().length < 5 || (decision === 'REFUND_PARTIAL' && !Number(amount))} onClick={resolve}>Chốt quyết định</button></div>}
        {d.status === 'RESOLVED' && <div style={{ marginTop: 14, background: '#eef8f2', borderRadius: 10, padding: 10, fontSize: 13 }}><b>Đã giải quyết:</b> {RES[d.resolution ?? ''] ?? d.resolution}{d.refund_amount ? ` — ${vnd(d.refund_amount)}` : ''}<br />{d.admin_note}</div>}
      </aside></div>}
  </div>;
}
