'use client';
import { useCallback, useEffect, useState } from 'react';
import '../../../app/goi-dich-vu/billing.css';

type Headers = () => Record<string, string>;
type Summary = { totalHeld: string; totalDeposited: string; totalSpent: string; totalMoney: string; totalVat: string; successCount: number; pendingCount: number; failedCount: number };
type Row = { id: string; code: string; userId: string; userName: string; email: string | null; phone: string | null; amount: string; vat: string; coin: string; method: string; status: string; createdAt: string; paidAt: string | null };
type List = { items: Row[]; page: number; limit: number; total: number };

const n = (v?: string | number | null) => (Number(v ?? 0) || 0).toLocaleString('vi-VN');
const dt = (v?: string | null) => (v ? new Date(v).toLocaleString('vi-VN') : '—');
const STATUS: Record<string, [string, string]> = { PENDING: ['Đang chờ', 'wait'], SUCCESS: ['Thành công', 'ok'], FAILED: ['Thất bại', 'bad'], CANCELLED: ['Đã hủy', ''], EXPIRED: ['Hết hạn', ''], REFUNDED: ['Đã hoàn', ''] };
const METHOD: Record<string, string> = { PAYOS: 'PayOS / VietQR', MANUAL: 'Chuyển khoản' };

/** Quản lý TTTCoin: thống kê, danh sách giao dịch nạp, hoàn nạp, điều chỉnh Coin (luôn ghi sổ cái). */
export function CoinAdmin({ authHeaders }: { authHeaders: Headers }) {
  const [sum, setSum] = useState<Summary | null>(null);
  const [list, setList] = useState<List | null>(null);
  const [q, setQ] = useState(''); const [status, setStatus] = useState(''); const [method, setMethod] = useState('');
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [page, setPage] = useState(1);
  const [error, setError] = useState(''); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  const [adj, setAdj] = useState({ userId: '', kind: 'CREDIT', amount: '', reason: '', note: '' });

  const call = useCallback(async <T,>(path: string, method = 'GET', body?: unknown): Promise<T> => {
    const res = await fetch('/api/v1' + path, { method, headers: authHeaders(), body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) throw new Error(Array.isArray(json?.message) ? json.message.join('. ') : json?.message || 'Thao tác không thành công.');
    if (json.message && method !== 'GET') setOk(json.message);
    return json.data as T;
  }, [authHeaders]);

  const load = useCallback(async () => {
    setError('');
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (q.trim()) qs.set('q', q.trim()); if (status) qs.set('status', status); if (method) qs.set('method', method); if (from) qs.set('from', from); if (to) qs.set('to', to);
      const [s, l] = await Promise.all([call<Summary>('/admin/billing/coin/summary'), call<List>('/admin/billing/coin/transactions?' + qs.toString())]);
      setSum(s); setList(l);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.'); }
  }, [call, q, status, method, from, to, page]);
  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setError(''); setOk(''); try { await fn(); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); } };
  const refund = (r: Row) => { const reason = window.prompt(`Lý do hoàn giao dịch ${r.code} (thu hồi ${n(r.coin)} TTTCoin)?`); if (reason) void run(() => call(`/admin/billing/topups/${r.id}/refund`, 'POST', { reason })); };
  const adjust = () => {
    const amount = Math.trunc(Number(adj.amount.replace(/\D/g, '')));
    if (!adj.userId.trim() || !amount) { setError('Nhập mã thành viên và số Coin.'); return; }
    if (adj.reason.trim().length < 3) { setError('Nhập lý do điều chỉnh.'); return; }
    if (!window.confirm(`${adj.kind === 'CREDIT' ? 'Cộng' : 'Trừ'} ${n(amount)} TTTCoin ${adj.kind === 'CREDIT' ? 'cho' : 'của'} thành viên này?`)) return;
    void run(async () => { await call(`/admin/billing/users/${encodeURIComponent(adj.userId.trim())}/credit`, 'POST', { amount: adj.kind === 'CREDIT' ? amount : -amount, note: [adj.reason.trim(), adj.note.trim()].filter(Boolean).join(' — ') }); setAdj({ userId: '', kind: 'CREDIT', amount: '', reason: '', note: '' }); });
  };
  const pages = list ? Math.max(1, Math.ceil(list.total / list.limit)) : 1;
  const tile = (label: string, value: string) => <div className="bl-card" style={{ padding: 14 }}><div style={{ color: '#71817b', fontSize: 12.5 }}>{label}</div><div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div></div>;

  return <div className="bl" style={{ padding: 0 }}>
    <h2 style={{ margin: '0 0 12px' }}>Quản lý TTTCoin</h2>
    {error && <div className="bl-msg bad" role="alert">{error}</div>}
    {ok && <div className="bl-msg ok" role="status">{ok}</div>}
    {sum && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 14 }}>
      {tile('Coin người dùng đang sở hữu', n(sum.totalHeld) + ' TTTCoin')}{tile('Tổng Coin đã nạp', n(sum.totalDeposited) + ' TTTCoin')}{tile('Tổng Coin đã sử dụng', n(sum.totalSpent) + ' TTTCoin')}
      {tile('Tổng tiền nạp', n(sum.totalMoney) + ' đ')}{tile('Tổng VAT', n(sum.totalVat) + ' đ')}
      {tile('Giao dịch thành công', n(sum.successCount))}{tile('Giao dịch đang chờ', n(sum.pendingCount))}{tile('Giao dịch thất bại', n(sum.failedCount))}
    </div>}

    <div className="bl-card">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <input className="bl-in" placeholder="Tìm mã GD / tên / email / SĐT / mã thành viên" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} style={{ flex: '1 1 240px' }} />
        <select className="bl-in" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Mọi trạng thái</option>{Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
        <select className="bl-in" value={method} onChange={e => { setMethod(e.target.value); setPage(1); }}><option value="">Mọi phương thức</option>{Object.entries(METHOD).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <input className="bl-in" type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} aria-label="Từ ngày" />
        <input className="bl-in" type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} aria-label="Đến ngày" />
      </div>
      <div style={{ overflowX: 'auto' }}><table className="bl-tbl"><thead><tr><th>Mã GD</th><th>Thành viên</th><th>Số tiền</th><th>VAT</th><th>TTTCoin</th><th>Phương thức</th><th>Trạng thái</th><th>Thời gian</th><th /></tr></thead><tbody>
        {list?.items.map(r => { const [label, cls] = STATUS[r.status] ?? [r.status, '']; return <tr key={r.id}><td><b>{r.code}</b></td>
          <td>{r.userName || '—'}<div style={{ fontSize: 12, color: '#71817b' }}>{r.email || r.phone || r.userId}</div></td>
          <td>{n(r.amount)} đ</td><td>{n(r.vat)} đ</td><td><b>{n(r.coin)}</b></td><td>{METHOD[r.method] ?? r.method}</td>
          <td><span className={`bl-pill ${cls}`}>{label}</span></td><td>{dt(r.createdAt)}</td>
          <td>{r.status === 'SUCCESS' && <button className="bl-btn sm" disabled={busy} onClick={() => refund(r)}>Hoàn</button>}</td></tr>; })}
        {list && !list.items.length && <tr><td colSpan={9} style={{ color: '#71817b' }}>Không có giao dịch phù hợp.</td></tr>}
      </tbody></table></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}><button className="bl-btn sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button><span>Trang {page}/{pages}</span><button className="bl-btn sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Sau</button></div>
    </div>

    <div className="bl-card" style={{ marginTop: 14 }}><h3 style={{ marginTop: 0 }}>Điều chỉnh TTTCoin thủ công</h3>
      <p style={{ color: '#71817b', fontSize: 13, marginTop: 0 }}>Mọi điều chỉnh được ghi vào sổ cái kèm quản trị viên thực hiện, lý do và địa chỉ IP. Không thể sửa trực tiếp số dư.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input className="bl-in" placeholder="Mã thành viên (UUID)" value={adj.userId} onChange={e => setAdj({ ...adj, userId: e.target.value })} style={{ flex: '2 1 260px' }} />
        <select className="bl-in" value={adj.kind} onChange={e => setAdj({ ...adj, kind: e.target.value })}><option value="CREDIT">CREDIT (cộng)</option><option value="DEBIT">DEBIT (trừ)</option></select>
        <input className="bl-in" inputMode="numeric" placeholder="Số Coin" value={adj.amount} onChange={e => setAdj({ ...adj, amount: e.target.value })} style={{ flex: '1 1 120px' }} />
        <input className="bl-in" placeholder="Lý do (bắt buộc)" value={adj.reason} onChange={e => setAdj({ ...adj, reason: e.target.value })} style={{ flex: '2 1 200px' }} />
        <input className="bl-in" placeholder="Ghi chú" value={adj.note} onChange={e => setAdj({ ...adj, note: e.target.value })} style={{ flex: '2 1 200px' }} />
        <button className="bl-btn primary" disabled={busy} onClick={adjust}>Thực hiện</button>
      </div>
    </div>
  </div>;
}
