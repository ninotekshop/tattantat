'use client';
import { useCallback, useEffect, useState } from 'react';
import '../../../app/goi-dich-vu/billing.css';
import { MoneyInput } from '../../MoneyInput';
import { planLabel } from '../../../lib/billing';

type Headers = () => Record<string, string>;
type Customer = { id: string; userId: string; userName: string; email: string | null; phone: string | null; planName: string; billingCycle: string; price: string; maxListings: number | null; effectiveStatus: string; startsAt: string; endsAt: string | null; balance: string };
type Stats = { active: number; expiring: number; planRevenueMonth: string; promoRevenueMonth: string; pendingTopups: number };
type Topup = { id: string; code: string; amount: string; status: string; receivedAmount: string | null; createdAt: string; expiresAt: string; rejectReason: string | null; userId: string; userName: string; email: string | null; phone: string | null };
type PlanRow = { id: string; code: string; name: string; status: string; price: string | null; billing_cycle?: 'MONTHLY' | 'YEARLY'; max_listings?: number | null; features?: unknown; duration_hours?: number; promotion_type?: string };
type Bank = { bankBin: string; bankName: string; accountNumber: string; accountName: string };

const BANKS: [string, string][] = [['970436', 'Vietcombank'], ['970415', 'VietinBank'], ['970418', 'BIDV'], ['970405', 'Agribank'], ['970422', 'MB Bank'], ['970407', 'Techcombank'], ['970416', 'ACB'], ['970432', 'VPBank'], ['970403', 'Sacombank'], ['970423', 'TPBank'], ['970441', 'VIB'], ['970443', 'SHB'], ['970448', 'OCB'], ['970426', 'MSB'], ['970437', 'HDBank']];
const vnd = (v?: string | number | null) => (Number(v ?? 0) || 0).toLocaleString('vi-VN') + '\u00a0đ';
const dt = (v?: string | null) => (v ? new Date(v).toLocaleString('vi-VN') : '—');
const dOnly = (v?: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');
const STATUS: Record<string, [string, string]> = { ACTIVE: ['Đang hiệu lực', 'ok'], EXPIRED: ['Hết hạn', ''], CANCELLED: ['Đã hủy/thay', ''] };
const TOPUP: Record<string, [string, string]> = { PENDING: ['Chờ xác nhận', 'wait'], CONFIRMED: ['Đã cộng tiền', 'ok'], REJECTED: ['Từ chối', 'bad'], CANCELLED: ['Khách hủy', ''], EXPIRED: ['Hết hạn', ''] };

export function CustomerPackagesAdmin({ authHeaders, mode = 'all' }: { authHeaders: Headers; mode?: 'all' | 'pricing' }) {
  const [tab, setTab] = useState<'customers' | 'topups' | 'pricing' | 'bank'>(mode === 'pricing' ? 'pricing' : 'customers');
  const [error, setError] = useState(''); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  const call = useCallback(async <T,>(path: string, method = 'GET', body?: unknown): Promise<T> => {
    const res = await fetch('/api/v1' + path, { method, headers: authHeaders(), body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) throw new Error(Array.isArray(json?.message) ? json.message.join('. ') : json?.message || 'Thao tác không thành công.');
    if (json.message && method !== 'GET') setOk(json.message);
    return json.data as T;
  }, [authHeaders]);
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setError(''); setOk(''); try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); } };

  // customers
  const [customers, setCustomers] = useState<Customer[]>([]); const [q, setQ] = useState(''); const [status, setStatus] = useState('');
  const loadCustomers = useCallback(() => run(async () => { const r = await call<{ items: Customer[]; stats: Stats }>(`/admin/billing/customers?q=${encodeURIComponent(q)}&status=${status}`); setCustomers(r.items); setStats(r.stats); }), [call, q, status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'customers') void loadCustomers(); }, [tab, status]); // eslint-disable-line react-hooks/exhaustive-deps
  const extend = (c: Customer) => { const d = window.prompt(`Gia hạn thêm bao nhiêu ngày cho ${c.userName}? (1–366)`, '30'); if (!d) return; void run(async () => { await call(`/admin/billing/subscriptions/${c.id}/extend`, 'POST', { days: Number(d) }); await loadCustomers(); }); };
  const cancel = (c: Customer) => { if (!window.confirm(`Hủy gói "${c.planName}" của ${c.userName}? Khách sẽ quay về hạn mức miễn phí.`)) return; void run(async () => { await call(`/admin/billing/subscriptions/${c.id}/cancel`, 'POST', {}); await loadCustomers(); }); };
  const credit = (c: Customer) => {
    const a = window.prompt(`Điều chỉnh ví của ${c.userName} (số dư ${vnd(c.balance)}). Nhập số tiền, dương để cộng, âm để trừ:`); if (!a) return;
    const note = window.prompt('Lý do điều chỉnh (bắt buộc):'); if (!note) return;
    void run(async () => { await call(`/admin/billing/users/${c.userId}/credit`, 'POST', { amount: Number(a), note }); await loadCustomers(); });
  };

  // topups
  const [topups, setTopups] = useState<Topup[]>([]); const [tStatus, setTStatus] = useState('PENDING');
  const loadTopups = useCallback(() => run(async () => { setTopups(await call<Topup[]>(`/admin/billing/topups?status=${tStatus}`)); }), [call, tStatus]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'topups') void loadTopups(); }, [tab, tStatus]); // eslint-disable-line react-hooks/exhaustive-deps
  const confirmTopup = (t: Topup) => {
    const input = window.prompt(`Xác nhận đã nhận tiền của ${t.userName} (mã ${t.code}).\nSố tiền THỰC NHẬN (yêu cầu ${vnd(t.amount)}):`, t.amount); if (input === null) return;
    void run(async () => { await call(`/admin/billing/topups/${t.id}/confirm`, 'POST', { receivedAmount: Number(input) }); await loadTopups(); });
  };
  const rejectTopup = (t: Topup) => { const reason = window.prompt('Lý do từ chối (khách sẽ thấy):'); if (!reason) return; void run(async () => { await call(`/admin/billing/topups/${t.id}/reject`, 'POST', { reason }); await loadTopups(); }); };

  // pricing
  const [plans, setPlans] = useState<PlanRow[]>([]); const [packs, setPacks] = useState<PlanRow[]>([]);
  const loadPricing = useCallback(() => run(async () => { const [a, b] = await Promise.all([call<PlanRow[]>('/admin/subscription-plans'), call<PlanRow[]>('/admin/promotion-packages')]); setPlans(a); setPacks(b); }), [call]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'pricing') void loadPricing(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps
  const [form, setForm] = useState<{ kind: 'plan' | 'pack'; id?: string; code: string; name: string; price: string; cycle: 'MONTHLY' | 'YEARLY'; max: string; features: string; hours: string; type: string; reason: string } | null>(null);
  const openPlan = (p?: PlanRow) => setForm({ kind: 'plan', id: p?.id, code: p?.code ?? '', name: p?.name ?? '', price: p?.price ?? '0', cycle: p?.billing_cycle ?? 'MONTHLY', max: p?.max_listings == null ? '' : String(p.max_listings), features: Array.isArray(p?.features) ? (p!.features as string[]).join('\n') : '', hours: '', type: '', reason: '' });
  const openPack = (p?: PlanRow) => setForm({ kind: 'pack', id: p?.id, code: p?.code ?? '', name: p?.name ?? '', price: p?.price ?? '0', cycle: 'MONTHLY', max: '', features: '', hours: String(p?.duration_hours ?? 24), type: p?.promotion_type ?? 'BOOST', reason: '' });
  const savePricing = () => { if (!form) return; void run(async () => {
    const isPlan = form.kind === 'plan'; const base = isPlan ? '/admin/subscription-plans' : '/admin/promotion-packages';
    const version = isPlan ? { price: form.price, billingCycle: form.cycle, maxListings: form.max.trim() === '' ? null : Number(form.max), features: form.features.split('\n').map(s => s.trim()).filter(Boolean), reason: form.reason }
      : { price: form.price, durationHours: Number(form.hours), promotionType: form.type, reason: form.reason };
    if (form.id) await call(`${base}/${form.id}/versions`, 'POST', version); else await call(base, 'POST', { code: form.code.trim(), name: form.name.trim(), ...version });
    setForm(null); await loadPricing();
  }); };

  const [hist, setHist] = useState<{ title: string; rows: Record<string, unknown>[] } | null>(null);
  const showHistory = (kind: 'plan' | 'pack', p: PlanRow) => void run(async () => {
    const rows = await call<Record<string, unknown>[]>(`/admin/${kind === 'plan' ? 'subscription-plans' : 'promotion-packages'}/${p.id}/versions`);
    setHist({ title: `Lịch sử giá — ${p.name}`, rows });
  });
  const toggleStatus = (kind: 'plan' | 'pack', p: PlanRow) => {
    const next = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const reason = window.prompt(next === 'INACTIVE' ? `Ngừng bán "${p.name}"? Khách đã mua vẫn giữ quyền lợi. Nhập lý do:` : `Mở bán lại "${p.name}". Nhập lý do:`); if (!reason) return;
    void run(async () => { await call(`/admin/${kind === 'plan' ? 'subscription-plans' : 'promotion-packages'}/${p.id}/status`, 'POST', { status: next, reason }); await loadPricing(); });
  };

  // bank
  const [bank, setBank] = useState<Bank>({ bankBin: '', bankName: '', accountNumber: '', accountName: '' });
  useEffect(() => { if (tab === 'bank') void run(async () => { const b = await call<Bank | null>('/admin/billing/bank'); if (b) setBank(b); }); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="bl" style={{ padding: 0 }}>
    {error && <div className="bl-msg err" role="alert">{error}</div>}{ok && <div className="bl-msg ok" role="status">{ok}</div>}
    {mode === 'all' && stats && <div className="bl-grid plans" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
      {[['Gói đang hiệu lực', String(stats.active)], ['Sắp hết hạn (7 ngày)', String(stats.expiring)], ['Doanh thu gói tháng này', vnd(stats.planRevenueMonth)], ['Doanh thu đẩy tin tháng này', vnd(stats.promoRevenueMonth)], ['Yêu cầu nạp chờ duyệt', String(stats.pendingTopups)]].map(([l, v]) =>
        <div key={l} className="bl-card" style={{ margin: 0, padding: 14 }}><div style={{ color: '#71817b', fontSize: 12 }}>{l}</div><div style={{ fontSize: 22, fontWeight: 800, color: '#007c4b' }}>{v}</div></div>)}
    </div>}
    {mode === 'all' && <div className="bl-toggle" role="tablist">{([['customers', 'Khách hàng mua gói'], ['topups', 'Yêu cầu nạp tiền'], ['pricing', 'Bảng giá gói'], ['bank', 'Tài khoản nhận tiền']] as const).map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{k === 'topups' && stats?.pendingTopups ? ` (${stats.pendingTopups})` : ''}</button>)}</div>}

    {tab === 'customers' && <div className="bl-card">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <input className="bl-in" placeholder="Tìm tên, email, SĐT…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void loadCustomers(); }} />
        <select className="bl-in" style={{ maxWidth: 200 }} value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang hiệu lực</option><option value="EXPIRING">Sắp hết hạn (7 ngày)</option><option value="EXPIRED">Đã hết hạn</option><option value="CANCELLED">Đã hủy/thay</option></select>
        <button className="bl-btn primary" disabled={busy} onClick={() => void loadCustomers()}>Tìm kiếm</button>
      </div>
      <div style={{ overflowX: 'auto' }}><table className="bl-tbl"><thead><tr><th>Khách hàng</th><th>Gói</th><th>Giá</th><th>Hạn mức tin</th><th>Hiệu lực</th><th>Trạng thái</th><th>Số dư ví</th><th /></tr></thead><tbody>
        {customers.map(c => { const [label, cls] = STATUS[c.effectiveStatus] ?? [c.effectiveStatus, '']; return <tr key={c.id}>
          <td><b>{c.userName}</b><div style={{ color: '#71817b', fontSize: 12 }}>{c.email ?? ''} {c.phone ?? ''}</div></td>
          <td>{planLabel(c.planName)}<div style={{ color: '#71817b', fontSize: 12 }}>{c.billingCycle === 'YEARLY' ? 'Theo năm' : 'Theo tháng'}</div></td><td>{vnd(c.price)}</td><td>{c.maxListings ?? '∞'}</td>
          <td>{dOnly(c.startsAt)} → {dOnly(c.endsAt)}</td><td><span className={`bl-pill ${cls}`}>{label}</span></td><td>{vnd(c.balance)}</td>
          <td style={{ whiteSpace: 'nowrap' }}><button className="bl-btn sm" disabled={busy || c.effectiveStatus === 'CANCELLED'} onClick={() => extend(c)}>Gia hạn</button>{' '}
            <button className="bl-btn sm" disabled={busy} onClick={() => credit(c)}>Ví</button>{' '}
            <button className="bl-btn sm" disabled={busy || c.effectiveStatus !== 'ACTIVE'} onClick={() => cancel(c)}>Hủy</button></td></tr>; })}
        {!customers.length && <tr><td colSpan={8} style={{ color: '#71817b' }}>{busy ? 'Đang tải…' : 'Chưa có khách hàng nào mua gói.'}</td></tr>}
      </tbody></table></div></div>}

    {tab === 'topups' && <div className="bl-card">
      <div style={{ marginBottom: 12 }}><select className="bl-in" style={{ maxWidth: 220 }} value={tStatus} onChange={e => setTStatus(e.target.value)}><option value="PENDING">Chờ xác nhận</option><option value="CONFIRMED">Đã cộng tiền</option><option value="REJECTED">Đã từ chối</option><option value="EXPIRED">Hết hạn</option><option value="CANCELLED">Khách hủy</option><option value="">Tất cả</option></select></div>
      <div className="bl-msg info">Đối chiếu sao kê ngân hàng theo <b>nội dung chuyển khoản = mã nạp</b> và số tiền, rồi bấm Xác nhận để cộng tiền vào ví khách.</div>
      <div style={{ overflowX: 'auto' }}><table className="bl-tbl"><thead><tr><th>Mã nạp</th><th>Khách hàng</th><th>Số tiền</th><th>Tạo lúc</th><th>Trạng thái</th><th /></tr></thead><tbody>
        {topups.map(t => { const [label, cls] = TOPUP[t.status] ?? [t.status, '']; return <tr key={t.id}><td><b>{t.code}</b></td>
          <td>{t.userName}<div style={{ color: '#71817b', fontSize: 12 }}>{t.email ?? ''} {t.phone ?? ''}</div></td>
          <td>{vnd(t.amount)}{t.receivedAmount && t.receivedAmount !== t.amount && <div style={{ fontSize: 12, color: '#007c4b' }}>Nhận: {vnd(t.receivedAmount)}</div>}</td><td>{dt(t.createdAt)}</td>
          <td><span className={`bl-pill ${cls}`}>{label}</span>{t.rejectReason && <div style={{ fontSize: 12, color: '#a64329' }}>{t.rejectReason}</div>}</td>
          <td style={{ whiteSpace: 'nowrap' }}>{['PENDING', 'EXPIRED'].includes(t.status) && <><button className="bl-btn sm primary" disabled={busy} onClick={() => confirmTopup(t)}>Xác nhận</button>{' '}<button className="bl-btn sm" disabled={busy} onClick={() => rejectTopup(t)}>Từ chối</button></>}</td></tr>; })}
        {!topups.length && <tr><td colSpan={6} style={{ color: '#71817b' }}>{busy ? 'Đang tải…' : 'Không có yêu cầu nào.'}</td></tr>}
      </tbody></table></div></div>}

    {tab === 'pricing' && <div>
      <div className="bl-card"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0 }}>Gói đăng tin (thuê bao)</h2><button className="bl-btn sm primary" onClick={() => openPlan()}>+ Thêm gói</button></div>
        <table className="bl-tbl" style={{ marginTop: 10 }}><thead><tr><th>Mã</th><th>Tên</th><th>Giá</th><th>Chu kỳ</th><th>Hạn mức tin</th><th>Trạng thái</th><th /></tr></thead><tbody>{plans.map(p => <tr key={p.id}><td>{p.code}</td><td>{planLabel(p.name)}</td><td>{p.price ? vnd(p.price) : '—'}</td><td>{p.billing_cycle === 'YEARLY' ? 'Năm' : p.billing_cycle ? 'Tháng' : '—'}</td><td>{p.max_listings ?? '∞'}</td><td><span className={`bl-pill ${p.status === 'ACTIVE' ? 'ok' : ''}`}>{p.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}</span></td><td style={{ whiteSpace: 'nowrap' }}><button className="bl-btn sm" onClick={() => openPlan(p)}>Sửa giá / quyền lợi</button>{' '}<button className="bl-btn sm" onClick={() => showHistory('plan', p)}>Lịch sử giá</button>{' '}<button className="bl-btn sm" onClick={() => toggleStatus('plan', p)}>{p.status === 'ACTIVE' ? 'Ngừng bán' : 'Mở bán'}</button></td></tr>)}</tbody></table></div>
      <div className="bl-card"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0 }}>Gói đẩy tin / tin nổi bật</h2><button className="bl-btn sm primary" onClick={() => openPack()}>+ Thêm gói</button></div>
        <table className="bl-tbl" style={{ marginTop: 10 }}><thead><tr><th>Mã</th><th>Tên</th><th>Loại</th><th>Giá</th><th>Thời lượng</th><th>Trạng thái</th><th /></tr></thead><tbody>{packs.map(p => <tr key={p.id}><td>{p.code}</td><td>{p.name}</td><td>{p.promotion_type === 'FEATURED' ? 'Tin nổi bật' : 'Đẩy tin'}</td><td>{p.price ? vnd(p.price) : '—'}</td><td>{p.duration_hours ? `${p.duration_hours} giờ` : '—'}</td><td><span className={`bl-pill ${p.status === 'ACTIVE' ? 'ok' : ''}`}>{p.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}</span></td><td style={{ whiteSpace: 'nowrap' }}><button className="bl-btn sm" onClick={() => openPack(p)}>Sửa giá</button>{' '}<button className="bl-btn sm" onClick={() => showHistory('pack', p)}>Lịch sử giá</button>{' '}<button className="bl-btn sm" onClick={() => toggleStatus('pack', p)}>{p.status === 'ACTIVE' ? 'Ngừng bán' : 'Mở bán'}</button></td></tr>)}</tbody></table></div>
      <div className="bl-msg info">Mỗi lần sửa tạo phiên bản giá mới có lý do; khách đã mua giữ nguyên giá và quyền lợi đã mua.</div>
    </div>}

    {tab === 'bank' && <div className="bl-card" style={{ maxWidth: 560 }}><h2>Tài khoản nhận tiền nạp</h2>
      <div className="bl-msg info">Thông tin này dùng để tạo mã QR VietQR và hướng dẫn chuyển khoản cho khách hàng.</div>
      <label style={{ fontWeight: 700 }}>Ngân hàng</label>
      <select className="bl-in" style={{ maxWidth: '100%', marginBottom: 10 }} value={bank.bankBin} onChange={e => { const b = BANKS.find(x => x[0] === e.target.value); setBank({ ...bank, bankBin: e.target.value, bankName: b ? b[1] : bank.bankName }); }}><option value="">— Chọn ngân hàng —</option>{BANKS.map(([bin, name]) => <option key={bin} value={bin}>{name} ({bin})</option>)}</select>
      <label style={{ fontWeight: 700 }}>Số tài khoản</label><input className="bl-in" style={{ maxWidth: '100%', marginBottom: 10 }} value={bank.accountNumber} onChange={e => setBank({ ...bank, accountNumber: e.target.value })} />
      <label style={{ fontWeight: 700 }}>Tên chủ tài khoản (IN HOA, không dấu)</label><input className="bl-in" style={{ maxWidth: '100%', marginBottom: 14 }} value={bank.accountName} onChange={e => setBank({ ...bank, accountName: e.target.value.toUpperCase() })} />
      <button className="bl-btn primary" disabled={busy} onClick={() => void run(async () => { await call('/admin/billing/bank', 'PUT', bank); })}>Lưu tài khoản</button></div>}

    {hist && <div className="bl-modal" onClick={() => setHist(null)}><div onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '90vh', overflow: 'auto' }}>
      <h2 style={{ marginTop: 0 }}>{hist.title}</h2>
      <table className="bl-tbl"><thead><tr><th>Áp dụng từ</th><th>Đến</th><th>Giá</th><th>Lý do</th></tr></thead><tbody>
        {hist.rows.map((r, i) => <tr key={i}><td>{dt(String(r.effective_from ?? ''))}</td><td>{r.effective_to ? dt(String(r.effective_to)) : 'Hiện hành'}</td><td>{vnd(r.price as string)}</td><td>{String(r.reason ?? '')}</td></tr>)}
        {!hist.rows.length && <tr><td colSpan={4} style={{ color: '#71817b' }}>Chưa có lịch sử.</td></tr>}
      </tbody></table>
      <div style={{ marginTop: 12 }}><button className="bl-btn" onClick={() => setHist(null)}>Đóng</button></div>
    </div></div>}

    {form && <div className="bl-modal" onClick={() => !busy && setForm(null)}><div onClick={e => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: '90vh', overflow: 'auto' }}>
      <h2 style={{ marginTop: 0 }}>{form.id ? 'Cập nhật' : 'Thêm'} {form.kind === 'plan' ? 'gói đăng tin' : 'gói đẩy tin'}</h2>
      {!form.id && <><label style={{ fontWeight: 700 }}>Mã gói (IN HOA, ví dụ PRO_MONTH)</label><input className="bl-in" style={{ maxWidth: '100%', marginBottom: 8 }} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        <label style={{ fontWeight: 700 }}>Tên gói</label><input className="bl-in" style={{ maxWidth: '100%', marginBottom: 8 }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></>}
      <label style={{ fontWeight: 700 }}>Giá (VNĐ)</label><MoneyInput className="bl-in" style={{ maxWidth: '100%', marginBottom: 8 }} value={form.price} onChange={d => setForm({ ...form, price: d })} />
      {form.kind === 'plan' ? <>
        <label style={{ fontWeight: 700 }}>Chu kỳ</label><select className="bl-in" style={{ maxWidth: '100%', marginBottom: 8 }} value={form.cycle} onChange={e => setForm({ ...form, cycle: e.target.value as 'MONTHLY' | 'YEARLY' })}><option value="MONTHLY">Theo tháng</option><option value="YEARLY">Theo năm</option></select>
        <label style={{ fontWeight: 700 }}>Số tin đăng tối đa (để trống = không giới hạn)</label><input className="bl-in" type="number" min={1} style={{ maxWidth: '100%', marginBottom: 8 }} value={form.max} onChange={e => setForm({ ...form, max: e.target.value })} />
        <label style={{ fontWeight: 700 }}>Quyền lợi hiển thị (mỗi dòng một mục)</label><textarea className="bl-in" rows={4} style={{ maxWidth: '100%', marginBottom: 8 }} value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} /></>
        : <>
        <label style={{ fontWeight: 700 }}>Loại</label><select className="bl-in" style={{ maxWidth: '100%', marginBottom: 8 }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="BOOST">Đẩy tin</option><option value="FEATURED">Tin nổi bật</option></select>
        <label style={{ fontWeight: 700 }}>Thời lượng (giờ)</label><input className="bl-in" type="number" min={1} style={{ maxWidth: '100%', marginBottom: 8 }} value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} /></>}
      <label style={{ fontWeight: 700 }}>Lý do thay đổi (bắt buộc)</label><input className="bl-in" style={{ maxWidth: '100%', marginBottom: 14 }} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
      <div style={{ display: 'flex', gap: 10 }}><button className="bl-btn primary" disabled={busy} onClick={savePricing}>Lưu</button><button className="bl-btn" disabled={busy} onClick={() => setForm(null)}>Đóng</button></div>
    </div></div>}
  </div>;
}
