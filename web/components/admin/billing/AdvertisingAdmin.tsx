'use client';
import { Ic } from '../../Ic';
import { ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import '../../../app/goi-dich-vu/billing.css';

type Row = { id: string; seller_id: string; user_name: string; user_email: string | null; user_phone: string | null; ad_type: string; price: string; pricing_model: string | null; created_at: string; status: string; start_at: string | null; end_at: string | null; paid_at: string | null; product_title: string | null };

const TYPES: Record<string, string> = { SPONSORED_PRODUCT: 'Tin tài trợ', SPONSORED_SEARCH: 'Tài trợ tìm kiếm', BANNER: 'Banner', CATEGORY_PROMOTION: 'Nổi bật danh mục', SHOP_PROMOTION: 'Quảng bá cửa hàng' };
const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING_PAYMENT: { label: 'Chờ thanh toán', bg: '#fff3d6', fg: '#8a6410' },
  ACTIVE: { label: 'Đang chạy', bg: '#dff3e6', fg: '#137a4a' },
  COMPLETED: { label: 'Đã kết thúc', bg: '#eef3f0', fg: '#5c7267' },
  CANCELLED: { label: 'Đã hủy', bg: '#fde8e4', fg: '#a64329' },
  DRAFT: { label: 'Nháp', bg: '#eef3f0', fg: '#5c7267' },
};
const vnd = (v: string | number) => `${Number(v).toLocaleString('vi-VN')}\u00a0₫`;
const day = (v: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');

export function AdvertisingAdmin({ authHeaders, onGoBanners }: { authHeaders: () => Record<string, string>; onGoBanners?: () => void }) {
  const [rows, setRows] = useState<Row[]>([]); const [filter, setFilter] = useState('ALL'); const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/v1/admin/orders/advertising/list', { headers: authHeaders(), cache: 'no-store' });
      const j = await r.json();
      if (!r.ok || !j?.success) throw new Error(j?.message || 'Không tải được danh sách quảng cáo.');
      setRows(j.data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); }
  }, [authHeaders]);
  useEffect(() => { void load(); }, [load]);

  async function act(path: string, method: 'POST', okMsg: string, headers: Record<string, string> = {}) {
    setBusy(true); setError(''); setOk('');
    try {
      const r = await fetch(`/api/v1${path}`, { method, headers: { ...authHeaders(), ...headers }, body: '{}' });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.success) throw new Error(Array.isArray(j?.message) ? j.message.join('. ') : j?.message || 'Thao tác không thành công.');
      setOk(j.message || okMsg); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); }
  }
  const settle = (r: Row) => { if (window.confirm(`Xác nhận đã nhận ${vnd(r.price)} từ ${r.user_name} và kích hoạt chiến dịch?`)) void act(`/advertising/campaigns/${r.id}/settle`, 'POST', 'Đã kích hoạt chiến dịch.', { 'Idempotency-Key': crypto.randomUUID() }); };
  const cancel = (r: Row) => { if (window.confirm(`Hủy chiến dịch chờ thanh toán của ${r.user_name}?`)) void act(`/admin/orders/advertising/${r.id}/cancel`, 'POST', 'Đã hủy chiến dịch.'); };

  const shown = useMemo(() => rows.filter(r => (filter === 'ALL' || r.status === filter) && (!q.trim() || `${r.user_name} ${r.user_email ?? ''} ${r.user_phone ?? ''} ${r.product_title ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))), [rows, filter, q]);
  const stat = useMemo(() => ({
    pending: rows.filter(r => r.status === 'PENDING_PAYMENT').length,
    active: rows.filter(r => r.status === 'ACTIVE').length,
    revenue: rows.filter(r => r.paid_at).reduce((s, r) => s + Number(r.price || 0), 0),
  }), [rows]);

  return <div className="bl" style={{ padding: 0 }}>
    {error && <div className="bl-msg err">{error}</div>}{ok && <div className="bl-msg ok">{ok}</div>}
    <div className="bl-grid plans" style={{ marginBottom: 14 }}>
      {[['Chờ thanh toán', String(stat.pending)], ['Đang chạy', String(stat.active)], ['Doanh thu quảng cáo', vnd(stat.revenue)], ['Tổng chiến dịch', String(rows.length)]].map(([l, v]) =>
        <div key={l} className="bl-card" style={{ margin: 0, padding: 14 }}><div style={{ color: '#71817b', fontSize: 12 }}>{l}</div><div style={{ fontSize: 20, fontWeight: 800, color: '#007c4b' }}>{v}</div></div>)}
    </div>
    <div className="bl-card">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <input placeholder="Tìm theo tên, email, SĐT, tin đăng…" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 220, padding: '8px 12px', border: '1px solid #dce6e0', borderRadius: 8 }} />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #dce6e0', borderRadius: 8 }}>
          <option value="ALL">Tất cả trạng thái</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button className="bl-btn sm" disabled={busy} onClick={() => void load()}>Tải lại</button>
        {onGoBanners && <button className="bl-btn sm" onClick={onGoBanners}>Quản lý Banner <Ic i={ArrowRight} after/></button>}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="bl-tbl"><thead><tr><th>Khách hàng</th><th>Loại</th><th>Tin đăng</th><th>Ngân sách</th><th>Thời gian chạy</th><th>Trạng thái</th><th></th></tr></thead><tbody>
          {shown.map(r => { const st = STATUS[r.status] ?? { label: r.status, bg: '#eef3f0', fg: '#5c7267' }; return <tr key={r.id}>
            <td><b>{r.user_name}</b><div style={{ color: '#71817b', fontSize: 12 }}>{r.user_email ?? r.user_phone ?? '—'}</div></td>
            <td>{TYPES[r.ad_type] ?? r.ad_type}</td>
            <td>{r.product_title ?? '—'}</td>
            <td>{vnd(r.price)}</td>
            <td>{day(r.start_at)} – {day(r.end_at)}</td>
            <td><span style={{ background: st.bg, color: st.fg, borderRadius: 10, padding: '2px 9px', fontSize: 12, fontWeight: 700 }}>{st.label}</span></td>
            <td style={{ whiteSpace: 'nowrap' }}>{r.status === 'PENDING_PAYMENT' && <><button className="bl-btn sm primary" disabled={busy} onClick={() => settle(r)}>Xác nhận thanh toán</button>{' '}<button className="bl-btn sm" disabled={busy} onClick={() => cancel(r)}>Hủy</button></>}</td>
          </tr>; })}
          {!shown.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#71817b', padding: 24 }}>Chưa có chiến dịch quảng cáo nào.</td></tr>}
        </tbody></table>
      </div>
    </div>
  </div>;
}
