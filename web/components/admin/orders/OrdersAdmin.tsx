'use client';
import { Ic } from '../../Ic';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../../../app/goi-dich-vu/billing.css';

type Row = { id: string; order_code: string; total_amount: string; platform_fee: string; seller_net_amount: string; order_status: string; payment_status: string; shipping_status: string; payment_method: string | null; created_at: string; product_title: string; buyer_name: string; buyer_email: string | null; seller_name: string; seller_email: string | null };
type Detail = Row & { note: string | null; quantity: number; product_price: string; shipping_fee: string; discount_amount: string; payment_fee: string; shipping_method: string | null; confirmed_at: string | null; completed_at: string | null; cancelled_at: string | null; buyer_phone: string | null; seller_phone: string | null; receiver_name: string | null; receiver_phone: string | null; address_line: string | null; items: { product_name: string; unit_price: string; quantity: number; subtotal: string }[]; history: { status: string; note: string | null; created_at: string; actor: string }[]; payments: { provider: string; status: string; amount: string; transaction_id: string | null; paid_at: string | null }[]; shipment: { carrier: string | null; tracking_code: string | null; status: string } | null; allowedTransitions: string[]; buyer_id: string; seller_id: string };
type Stats = { total: number; counts: Record<string, number>; today: number; completed_amount: string; platform_fee: string; in_progress_amount: string };
type Chat = { messages: { id: string; sender_name: string; content: string; created_at: string }[] };

const ST: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING: { label: 'Chờ xác nhận', bg: '#fff3d6', fg: '#8a6410' }, CONFIRMED: { label: 'Đã xác nhận', bg: '#e8eefc', fg: '#3556a8' },
  PREPARING: { label: 'Đang chuẩn bị', bg: '#e8eefc', fg: '#3556a8' }, SHIPPING: { label: 'Đang giao', bg: '#e0f2fe', fg: '#0369a1' },
  DELIVERED: { label: 'Đã giao', bg: '#e6f6ed', fg: '#0a8a55' }, COMPLETED: { label: 'Hoàn tất', bg: '#dff3e6', fg: '#137a4a' },
  CANCELLED: { label: 'Đã hủy', bg: '#fde8e4', fg: '#a64329' }, DISPUTED: { label: 'Tranh chấp', bg: '#fde8f0', fg: '#a3315f' },
};
const PAY: Record<string, string> = { PENDING: 'Chưa thanh toán', PROCESSING: 'Đang xử lý', PAID: 'Đã thanh toán', FAILED: 'Thất bại', CANCELLED: 'Đã hủy', REFUNDED: 'Đã hoàn tiền', PARTIALLY_REFUNDED: 'Hoàn một phần' };
const METHOD: Record<string, string> = { COD: 'Thu hộ (COD)', BANK_TRANSFER: 'Chuyển khoản', VNPAY: 'VNPay', MOMO: 'MoMo', ZALOPAY: 'ZaloPay', WALLET: 'Ví' };
const vnd = (v: string | number | null | undefined) => `${Number(v || 0).toLocaleString('vi-VN')} ₫`;
const dt = (v: string | null | undefined) => (v ? new Date(v).toLocaleString('vi-VN', { hour12: false }) : '—');
const esc = (t: unknown) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const Badge = ({ s }: { s: string }) => { const x = ST[s] ?? { label: s, bg: '#eef3f0', fg: '#5c7267' }; return <span style={{ background: x.bg, color: x.fg, borderRadius: 10, padding: '2px 9px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{x.label}</span>; };
const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #dce6e0', borderRadius: 8, fontSize: 13, minWidth: 0 };

export function OrdersAdmin({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [f, setF] = useState({ q: '', status: '', paymentStatus: '', paymentMethod: '', from: '', to: '', minAmount: '', maxAmount: '' });
  const [dq, setDq] = useState(''); const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]); const [meta, setMeta] = useState({ total: 0, amount: '0', limit: 20 });
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null); const [chat, setChat] = useState<Chat | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => { const t = setTimeout(() => { setDq(f.q); setPage(1); }, 400); return () => clearTimeout(t); }, [f.q]);
  const qs = useMemo(() => { const p = new URLSearchParams(); Object.entries({ ...f, q: dq }).forEach(([k, v]) => { if (v) p.set(k, v); }); return p; }, [f, dq]);

  const call = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`/api/v1${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) }, cache: 'no-store' });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) throw new Error(Array.isArray(json?.message) ? json.message.join('. ') : json?.message || 'Thao tác không thành công.');
    return json as T;
  }, [authHeaders]);

  const loadStats = useCallback(async () => { try { setStats((await call<{ data: Stats }>('/admin/orders/stats')).data); } catch { /* thẻ thống kê là phụ */ } }, [call]);
  const load = useCallback(async () => {
    ctrl.current?.abort(); const c = new AbortController(); ctrl.current = c;
    setBusy(true); setError('');
    try {
      const p = new URLSearchParams(qs); p.set('page', String(page)); p.set('limit', '20');
      const j = await call<{ data: Row[]; meta: { total: number; amount: string; limit: number } }>(`/admin/orders?${p}`, { signal: c.signal });
      setRows(j.data); setMeta(j.meta);
    } catch (e) { if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { if (!c.signal.aborted) setBusy(false); }
  }, [qs, page, call]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadStats(); }, [loadStats]);

  const setFilter = (patch: Partial<typeof f>) => { setF(s => ({ ...s, ...patch })); setPage(1); };
  const reset = () => { setF({ q: '', status: '', paymentStatus: '', paymentMethod: '', from: '', to: '', minAmount: '', maxAmount: '' }); setPage(1); };

  async function open(id: string) {
    setChat(null); setError('');
    try { setDetail((await call<{ data: Detail }>(`/admin/orders/${id}`)).data); } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được chi tiết đơn.'); }
  }
  async function change(d: Detail, status: string) {
    let reason = '';
    if (status === 'CANCELLED') { reason = window.prompt(`Lý do hủy đơn ${d.order_code} (người mua và người bán sẽ thấy):`) ?? ''; if (reason.trim().length < 3) return; }
    else if (!window.confirm(`Chuyển đơn ${d.order_code} sang "${ST[status]?.label ?? status}"?`)) return;
    setBusy(true); setError(''); setOk('');
    try {
      const j = await call<{ message: string }>(`/admin/orders/${d.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, reason }) });
      setOk(j.message); await Promise.all([open(d.id), load(), loadStats()]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  async function loadChat(d: Detail) {
    try { setChat((await call<{ data: Chat }>(`/admin/orders/${d.id}/chat-history`)).data); } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được hội thoại.'); }
  }
  async function exportCsv() {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/v1/admin/orders/export?${qs}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Không xuất được file.');
      const url = URL.createObjectURL(await res.blob()); const a = document.createElement('a');
      a.href = url; a.download = `don-hang-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  function print(d: Detail) {
    const w = window.open('', '_blank', 'width=820,height=900'); if (!w) { setError('Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup rồi thử lại.'); return; }
    const items = d.items.length ? d.items : [{ product_name: d.product_title, unit_price: d.product_price, quantity: d.quantity, subtotal: d.product_price }];
    w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Phiếu đơn ${esc(d.order_code)}</title><style>body{font-family:Arial,sans-serif;color:#111;margin:28px}h1{font-size:20px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #bbb;padding:7px 9px;font-size:13px;text-align:left}th{background:#f2f2f2}.r{text-align:right}.g{display:grid;grid-template-columns:1fr 1fr;gap:16px}.muted{color:#555;font-size:12px}@media print{button{display:none}}</style></head><body>
<h1>TẤT TẦN TẬT — PHIẾU ĐƠN HÀNG</h1><div class="muted">Mã đơn: <b>${esc(d.order_code)}</b> · Ngày tạo: ${esc(dt(d.created_at))} · Trạng thái: ${esc(ST[d.order_status]?.label ?? d.order_status)}</div>
<div class="g" style="margin-top:14px"><div><b>Người mua</b><br>${esc(d.buyer_name)}<br>${esc(d.buyer_phone ?? '')}<br>${esc(d.buyer_email ?? '')}</div><div><b>Người bán</b><br>${esc(d.seller_name)}<br>${esc(d.seller_phone ?? '')}<br>${esc(d.seller_email ?? '')}</div></div>
<p><b>Giao đến:</b> ${esc(d.receiver_name ?? d.buyer_name)} ${d.receiver_phone ? '· ' + esc(d.receiver_phone) : ''}<br>${esc(d.address_line ?? 'Chưa có địa chỉ giao hàng')}</p>
<table><thead><tr><th>Sản phẩm</th><th class="r">Đơn giá</th><th class="r">SL</th><th class="r">Thành tiền</th></tr></thead><tbody>${items.map(i => `<tr><td>${esc(i.product_name)}</td><td class="r">${esc(vnd(i.unit_price))}</td><td class="r">${i.quantity}</td><td class="r">${esc(vnd(i.subtotal))}</td></tr>`).join('')}</tbody></table>
<table style="width:60%;margin-left:auto"><tr><td>Phí vận chuyển</td><td class="r">${esc(vnd(d.shipping_fee))}</td></tr><tr><td>Giảm giá</td><td class="r">${esc(vnd(d.discount_amount))}</td></tr><tr><th>Tổng thanh toán</th><th class="r">${esc(vnd(d.total_amount))}</th></tr></table>
<p class="muted">Thanh toán: ${esc(PAY[d.payment_status] ?? d.payment_status)} · ${esc(METHOD[d.payment_method ?? ''] ?? d.payment_method ?? '—')}${d.note ? '<br>Ghi chú: ' + esc(d.note) : ''}</p>
<button onclick="window.print()">In phiếu</button></body></html>`);
    w.document.close(); w.focus();
  }

  const cards: [string, string, string][] = stats ? [
    ['Tổng đơn', String(stats.total), ''], ['Chờ xác nhận', String(stats.counts.PENDING ?? 0), 'PENDING'],
    ['Đang xử lý', String((stats.counts.CONFIRMED ?? 0) + (stats.counts.PREPARING ?? 0) + (stats.counts.SHIPPING ?? 0)), ''],
    ['Đã giao', String(stats.counts.DELIVERED ?? 0), 'DELIVERED'], ['Hoàn tất', String(stats.counts.COMPLETED ?? 0), 'COMPLETED'], ['Đã hủy', String(stats.counts.CANCELLED ?? 0), 'CANCELLED'],
    ['Đơn hôm nay', String(stats.today), ''], ['Doanh thu hoàn tất', vnd(stats.completed_amount), ''], ['Phí nền tảng thu', vnd(stats.platform_fee), ''], ['Giá trị đang xử lý', vnd(stats.in_progress_amount), ''],
  ] : [];
  const pages = Math.max(1, Math.ceil(meta.total / (meta.limit || 20)));

  return <div className="bl" style={{ padding: 0 }}>
    {error && <div className="bl-msg err">{error}</div>}{ok && <div className="bl-msg ok">{ok}</div>}
    <div className="bl-grid plans" style={{ marginBottom: 14 }}>
      {cards.map(([l, v, st]) => <div key={l} className="bl-card" onClick={() => st && setFilter({ status: f.status === st ? '' : st })} style={{ margin: 0, padding: 14, cursor: st ? 'pointer' : 'default', outline: st && f.status === st ? '2px solid #008954' : 'none' }}>
        <div style={{ color: '#71817b', fontSize: 12 }}>{l}</div><div style={{ fontSize: 20, fontWeight: 800, color: '#007c4b' }}>{v}</div></div>)}
    </div>
    <div className="bl-card">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <input placeholder="Tìm mã đơn, người mua/bán, SĐT, sản phẩm…" value={f.q} onChange={e => setF(s => ({ ...s, q: e.target.value }))} style={{ ...inp, flex: 1, minWidth: 220 }} />
        <select value={f.status} onChange={e => setFilter({ status: e.target.value })} style={inp}><option value="">Mọi trạng thái</option>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <select value={f.paymentStatus} onChange={e => setFilter({ paymentStatus: e.target.value })} style={inp}><option value="">Mọi thanh toán</option>{Object.entries(PAY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={f.paymentMethod} onChange={e => setFilter({ paymentMethod: e.target.value })} style={inp}><option value="">Mọi phương thức</option>{Object.entries(METHOD).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <label style={{ fontSize: 12 }}>Từ <input type="date" value={f.from} onChange={e => setFilter({ from: e.target.value })} style={inp} /></label>
        <label style={{ fontSize: 12 }}>Đến <input type="date" value={f.to} onChange={e => setFilter({ to: e.target.value })} style={inp} /></label>
        <input type="number" min={0} placeholder="Giá trị từ (₫)" value={f.minAmount} onChange={e => setFilter({ minAmount: e.target.value })} style={{ ...inp, width: 140 }} />
        <input type="number" min={0} placeholder="Đến (₫)" value={f.maxAmount} onChange={e => setFilter({ maxAmount: e.target.value })} style={{ ...inp, width: 140 }} />
        <button className="bl-btn sm" onClick={reset}>Xóa lọc</button>
        <button className="bl-btn sm" disabled={busy} onClick={() => { void load(); void loadStats(); }}>Tải lại</button>
        <button className="bl-btn sm primary" disabled={busy || !meta.total} onClick={() => void exportCsv()}>Xuất Excel (CSV)</button>
      </div>
      <div style={{ color: '#71817b', fontSize: 12.5, marginBottom: 8 }}>{meta.total.toLocaleString('vi-VN')} đơn · tổng giá trị {vnd(meta.amount)}{busy ? ' · đang tải…' : ''}</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="bl-tbl"><thead><tr><th>Mã đơn</th><th>Sản phẩm</th><th>Người bán</th><th>Người mua</th><th>Giá trị</th><th>Phí sàn</th><th>Thanh toán</th><th>Ngày tạo</th><th>Trạng thái</th></tr></thead><tbody>
          {rows.map(r => <tr key={r.id} onClick={() => void open(r.id)} style={{ cursor: 'pointer' }}>
            <td><b>#{r.order_code}</b></td>
            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product_title}</td>
            <td>{r.seller_name}<div style={{ color: '#71817b', fontSize: 11 }}>{r.seller_email}</div></td>
            <td>{r.buyer_name}<div style={{ color: '#71817b', fontSize: 11 }}>{r.buyer_email}</div></td>
            <td style={{ fontWeight: 700, color: '#059669' }}>{vnd(r.total_amount)}</td><td>{vnd(r.platform_fee)}</td>
            <td>{PAY[r.payment_status] ?? r.payment_status}<div style={{ color: '#71817b', fontSize: 11 }}>{METHOD[r.payment_method ?? ''] ?? r.payment_method ?? ''}</div></td>
            <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString('vi-VN')}</td><td><Badge s={r.order_status} /></td>
          </tr>)}
          {!rows.length && <tr><td colSpan={9} style={{ textAlign: 'center', color: '#71817b', padding: 24 }}>{busy ? 'Đang tải…' : 'Không có đơn hàng phù hợp.'}</td></tr>}
        </tbody></table>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', marginTop: 12 }}>
        <button className="bl-btn sm" disabled={page <= 1 || busy} onClick={() => setPage(p => p - 1)}><Ic i={ArrowLeft}/>Trước</button>
        <span style={{ fontSize: 13 }}>Trang {page} / {pages}</span>
        <button className="bl-btn sm" disabled={page >= pages || busy} onClick={() => setPage(p => p + 1)}>Sau <Ic i={ArrowRight} after/></button>
      </div>
    </div>

    {detail && <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,35,28,.45)', zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
      <aside onClick={e => e.stopPropagation()} style={{ width: 'min(560px,100%)', background: '#fff', height: '100%', overflowY: 'auto', padding: 20, boxShadow: '-8px 0 30px #0002' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div><h2 style={{ margin: 0, fontSize: 18 }}>Đơn #{detail.order_code}</h2><div style={{ color: '#71817b', fontSize: 12 }}>Tạo lúc {dt(detail.created_at)}</div></div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Badge s={detail.order_status} /><button className="bl-btn sm" onClick={() => setDetail(null)} aria-label="Đóng"><X size={16} aria-hidden="true" /></button></div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
          {detail.allowedTransitions.map(t => <button key={t} disabled={busy} className={`bl-btn sm ${t === 'CANCELLED' ? '' : 'primary'}`} style={t === 'CANCELLED' ? { color: '#b53434', borderColor: '#f0cfc9' } : undefined} onClick={() => void change(detail, t)}>{t === 'CANCELLED' ? 'Hủy đơn' : `→ ${ST[t]?.label ?? t}`}</button>)}
          {!detail.allowedTransitions.length && <span style={{ color: '#71817b', fontSize: 12.5 }}>{detail.order_status === 'DISPUTED' ? 'Đơn đang khiếu nại — xử lý ở mục “Xử lý khiếu nại”.' : detail.order_status === 'DELIVERED' ? 'Đơn đã giao — hoàn tất qua luồng đối soát tài chính.' : 'Không còn bước chuyển trạng thái thủ công.'}</span>}
          <button className="bl-btn sm" style={{ marginLeft: 'auto' }} onClick={() => print(detail)}>In phiếu</button>
        </div>
        <Sec t="Các bên"><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          <div><b>Người mua</b><br />{detail.buyer_name}<br />{detail.buyer_phone ?? '—'}<br />{detail.buyer_email ?? ''}</div>
          <div><b>Người bán</b><br />{detail.seller_name}<br />{detail.seller_phone ?? '—'}<br />{detail.seller_email ?? ''}</div></div></Sec>
        <Sec t="Giao hàng"><div style={{ fontSize: 13 }}>{detail.receiver_name ?? detail.buyer_name} {detail.receiver_phone ? `· ${detail.receiver_phone}` : ''}<br />{detail.address_line ?? 'Chưa có địa chỉ giao hàng'}
          {detail.shipment && <><br />Vận chuyển: {detail.shipment.carrier ?? '—'} {detail.shipment.tracking_code ? `· ${detail.shipment.tracking_code}` : ''} ({detail.shipment.status})</>}
          {detail.note && <><br /><i>Ghi chú: {detail.note}</i></>}</div></Sec>
        <Sec t="Sản phẩm & thanh toán"><table className="bl-tbl"><tbody>
          {(detail.items.length ? detail.items : [{ product_name: detail.product_title, unit_price: detail.product_price, quantity: detail.quantity, subtotal: detail.product_price }]).map((i, n) => <tr key={n}><td>{i.product_name}</td><td>{vnd(i.unit_price)} × {i.quantity}</td><td style={{ textAlign: 'right' }}>{vnd(i.subtotal)}</td></tr>)}
          <tr><td colSpan={2}>Phí vận chuyển</td><td style={{ textAlign: 'right' }}>{vnd(detail.shipping_fee)}</td></tr>
          <tr><td colSpan={2}>Giảm giá</td><td style={{ textAlign: 'right' }}>−{vnd(detail.discount_amount)}</td></tr>
          <tr><td colSpan={2}><b>Tổng thanh toán</b></td><td style={{ textAlign: 'right' }}><b>{vnd(detail.total_amount)}</b></td></tr>
          <tr><td colSpan={2}>Phí nền tảng</td><td style={{ textAlign: 'right' }}>{vnd(detail.platform_fee)}</td></tr>
          <tr><td colSpan={2}>Người bán nhận</td><td style={{ textAlign: 'right' }}>{vnd(detail.seller_net_amount)}</td></tr></tbody></table>
          <div style={{ fontSize: 12.5, color: '#44604f', marginTop: 6 }}>{PAY[detail.payment_status] ?? detail.payment_status} · {METHOD[detail.payment_method ?? ''] ?? detail.payment_method ?? '—'}
            {detail.payments.map((p, n) => <div key={n}>• {p.provider}: {PAY[p.status] ?? p.status} {vnd(p.amount)}{p.transaction_id ? ` · ${p.transaction_id}` : ''}{p.paid_at ? ` · ${dt(p.paid_at)}` : ''}</div>)}</div></Sec>
        <Sec t="Dòng thời gian"><ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
          <li>Tạo đơn — {dt(detail.created_at)}</li>
          {detail.history.map((h, n) => <li key={n}><b>{ST[h.status]?.label ?? h.status}</b> — {dt(h.created_at)} · {h.actor}{h.note ? <div style={{ color: '#71817b' }}>{h.note}</div> : null}</li>)}
          {!detail.history.length && detail.confirmed_at && <li>Đã xác nhận — {dt(detail.confirmed_at)}</li>}
          {!detail.history.length && detail.completed_at && <li>Hoàn tất — {dt(detail.completed_at)}</li>}
          {!detail.history.length && detail.cancelled_at && <li>Đã hủy — {dt(detail.cancelled_at)}</li>}</ol></Sec>
        <Sec t="Hội thoại người mua – người bán">
          {!chat ? <button className="bl-btn sm" onClick={() => void loadChat(detail)}>Xem hội thoại</button>
            : chat.messages.length ? <div style={{ maxHeight: 260, overflowY: 'auto', display: 'grid', gap: 6 }}>{chat.messages.map(m => <div key={m.id} style={{ background: '#f4f8f6', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}><b>{m.sender_name}</b> <span style={{ color: '#71817b', fontSize: 11 }}>{dt(m.created_at)}</span><div>{m.content}</div></div>)}</div>
            : <span style={{ color: '#71817b', fontSize: 13 }}>Chưa có tin nhắn giữa hai bên.</span>}
        </Sec>
      </aside>
    </div>}
  </div>;
}

function Sec({ t, children }: { t: string; children: React.ReactNode }) {
  return <section style={{ borderTop: '1px solid #eef3ef', paddingTop: 12, marginTop: 12 }}><h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#44604f', textTransform: 'uppercase', letterSpacing: '.3px' }}>{t}</h3>{children}</section>;
}
