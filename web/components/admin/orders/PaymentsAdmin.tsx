'use client';
import { useCallback, useEffect, useState } from 'react';
import '../../../app/goi-dich-vu/billing.css';

type Pay = { id: string; payment_code: string; provider: string; amount: string; status: string; transaction_id: string | null; paid_at: string | null; created_at: string; order_code: string; order_status: string; buyer_name: string; seller_name: string };
type Task = { id: string; amount: string; reason: string; status: string; note: string | null; created_at: string; order_code: string; buyer_name: string; buyer_phone: string | null; buyer_email: string | null; provider: string; transaction_id: string | null };
type Item = { type: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; text: string };
type Settings = { paymentExpiryMinutes: number; autoConfirmDays: number; shipDeadlineDays: number };
const vnd = (v: string | number) => Number(v).toLocaleString('vi-VN') + ' đ';
const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #dce6e0', borderRadius: 8, fontSize: 13 };
const TABS = [['pay', 'Giao dịch'], ['refund', 'Cần hoàn tiền'], ['recon', 'Đối soát'], ['set', 'Cài đặt']] as const;
const COL = { HIGH: '#b53434', MEDIUM: '#c77700', LOW: '#71817b' };

export function PaymentsAdmin({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [tab, setTab] = useState<'pay' | 'refund' | 'recon' | 'set'>('pay');
  const [pays, setPays] = useState<Pay[]>([]); const [stats, setStats] = useState<{ held: string; paid_total: string; pending: number; refunds: number } | null>(null); const [gateway, setGateway] = useState<string | null>(null); const [gwErr, setGwErr] = useState<string | null>(null);
  const [status, setStatus] = useState(''); const [q, setQ] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]); const [items, setItems] = useState<Item[] | null>(null); const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState('');
  const call = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(`/api/v1${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) }, cache: 'no-store' });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.success) throw new Error(Array.isArray(j?.message) ? j.message.join('. ') : j?.message || 'Thao tác không thành công.');
    return j;
  }, [authHeaders]);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      if (tab === 'pay') { const p = new URLSearchParams({ status, q }); const j = (await call(`/admin/payments?${p}`)).data; setPays(j.items); setStats(j.stats); setGateway(j.gateway); setGwErr(j.gatewayError); }
      else if (tab === 'refund') setTasks((await call('/admin/payments/refund-tasks?status=')).data);
      else if (tab === 'recon') setItems((await call('/admin/payments/reconcile')).data.items);
      else setSettings((await call('/admin/payments/settings')).data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }, [call, tab, status, q]);
  useEffect(() => { void load(); }, [load]);
  const post = async (fn: () => Promise<{ message?: string }>) => { setBusy(true); setError(''); setOk(''); try { setOk((await fn()).message ?? 'Đã lưu.'); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); } };
  const done = (t: Task) => { const note = window.prompt(`Ghi mã giao dịch hoàn ${vnd(t.amount)} cho ${t.buyer_name}:`); if (note) void post(() => call(`/admin/payments/refund-tasks/${t.id}/done`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) })); };
  return <div className="bl" style={{ padding: 0 }}>
    {error && <div className="bl-msg err">{error}</div>}{ok && <div className="bl-msg ok">{ok}</div>}
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>{TABS.map(([k, l]) => <button key={k} className={`bl-btn sm ${tab === k ? '' : 'ghost'}`} style={tab === k ? {} : { background: '#fff', color: '#333' }} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === 'pay' && <div className="bl-card">
      {gwErr && <div className="bl-msg err">Thanh toán online chưa bật: {gwErr}. Đặt PAYMENT_GATEWAY=mock (thử) hoặc payos + khóa PayOS trong backend/.env.</div>}
      {gateway && <p style={{ fontSize: 13 }}>Cổng đang dùng: <b>{gateway}</b>{gateway === 'MOCK' && ' (giả lập — không thu tiền thật)'}</p>}
      {stats && <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}><div>Tiền đang giữ<br /><b>{vnd(stats.held)}</b></div><div>Tổng đã thu<br /><b>{vnd(stats.paid_total)}</b></div><div>Chờ thanh toán<br /><b>{stats.pending}</b></div><div>Chờ hoàn tiền<br /><b style={{ color: stats.refunds ? '#b53434' : undefined }}>{stats.refunds}</b></div></div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}><select style={inp} value={status} onChange={e => setStatus(e.target.value)}><option value="">Mọi trạng thái</option><option value="PENDING">Chờ thanh toán</option><option value="PAID">Đã thanh toán</option><option value="PROCESSING">Đang hoàn</option><option value="REFUNDED">Đã hoàn</option><option value="FAILED">Thất bại</option><option value="CANCELLED">Đã hủy</option></select><input style={inp} placeholder="Mã đơn / mã giao dịch" value={q} onChange={e => setQ(e.target.value)} /></div>
      <div style={{ overflowX: 'auto' }}><table className="bl-tbl"><thead><tr><th>Đơn</th><th>Người mua → bán</th><th>Số tiền</th><th>Cổng</th><th>Trạng thái</th><th>Thời gian</th></tr></thead><tbody>
        {pays.map(p => <tr key={p.id}><td><b>{p.order_code}</b><div style={{ fontSize: 12, color: '#71817b' }}>{p.order_status}</div></td><td>{p.buyer_name} → {p.seller_name}</td><td>{vnd(p.amount)}</td><td>{p.provider}<div style={{ fontSize: 11, color: '#71817b' }}>{p.transaction_id}</div></td><td>{p.status}</td><td>{new Date(p.paid_at ?? p.created_at).toLocaleString('vi-VN')}</td></tr>)}
        {!pays.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#71817b', padding: 24 }}>{busy ? 'Đang tải…' : 'Chưa có giao dịch online.'}</td></tr>}</tbody></table></div></div>}
    {tab === 'refund' && <div className="bl-card"><p style={{ fontSize: 13, color: '#71817b' }}>Đơn đã thanh toán online nhưng bị hủy. Hoàn tiền cho người mua qua cổng/ngân hàng rồi bấm “Đã hoàn” và ghi mã giao dịch.</p>
      <div style={{ overflowX: 'auto' }}><table className="bl-tbl"><thead><tr><th>Đơn</th><th>Người mua</th><th>Số tiền</th><th>Lý do</th><th>Trạng thái</th><th></th></tr></thead><tbody>
        {tasks.map(t => <tr key={t.id}><td><b>{t.order_code}</b></td><td>{t.buyer_name}<div style={{ fontSize: 12, color: '#71817b' }}>{t.buyer_phone ?? t.buyer_email}</div></td><td>{vnd(t.amount)}</td><td>{t.reason}</td><td>{t.status === 'DONE' ? `Đã hoàn — ${t.note}` : 'Chờ hoàn'}</td><td>{t.status === 'PENDING' && <button className="bl-btn sm" disabled={busy} onClick={() => done(t)}>Đã hoàn</button>}</td></tr>)}
        {!tasks.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#71817b', padding: 24 }}>{busy ? 'Đang tải…' : 'Không có yêu cầu hoàn tiền.'}</td></tr>}</tbody></table></div></div>}
    {tab === 'recon' && <div className="bl-card"><div style={{ display: 'flex', gap: 8, marginBottom: 12 }}><button className="bl-btn sm" disabled={busy} onClick={() => void load()}>Đối soát lại</button><button className="bl-btn sm" disabled={busy} onClick={() => void post(() => call('/admin/payments/run-jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }))}>Chạy tác vụ tự động ngay</button></div>
      {items && !items.length && <div className="bl-msg ok">Không phát hiện sai lệch giữa giao dịch và đơn hàng.</div>}
      {items?.map((i, n) => <div key={n} style={{ padding: '8px 0', borderBottom: '1px solid #eef3f0', fontSize: 14 }}><b style={{ color: COL[i.severity] }}>{i.severity === 'HIGH' ? 'Nghiêm trọng' : i.severity === 'MEDIUM' ? 'Cần xử lý' : 'Lưu ý'}</b> · {i.text}</div>)}</div>}
    {tab === 'set' && settings && <div className="bl-card"><div style={{ display: 'grid', gap: 10 }}>
      <label>Thời hạn thanh toán online <input type="number" style={{ ...inp, width: 80 }} min={5} max={1440} value={settings.paymentExpiryMinutes} onChange={e => setSettings({ ...settings, paymentExpiryMinutes: Number(e.target.value) })} /> phút (quá hạn sẽ hủy đơn)</label>
      <label>Tự xác nhận nhận hàng sau <input type="number" style={{ ...inp, width: 80 }} min={1} max={30} value={settings.autoConfirmDays} onChange={e => setSettings({ ...settings, autoConfirmDays: Number(e.target.value) })} /> ngày kể từ khi giao (nếu không khiếu nại)</label>
      <label>Tự hoàn tiền nếu người bán chưa giao sau <input type="number" style={{ ...inp, width: 80 }} min={1} max={30} value={settings.shipDeadlineDays} onChange={e => setSettings({ ...settings, shipDeadlineDays: Number(e.target.value) })} /> ngày kể từ khi thanh toán</label>
      <div><button className="bl-btn" disabled={busy} onClick={() => void post(async () => { const j = await call('/admin/payments/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) }); return j; })}>Lưu cài đặt</button></div></div></div>}
  </div>;
}
