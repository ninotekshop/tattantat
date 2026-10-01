'use client';
import '../goi-dich-vu/billing.css';
import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemberArea } from '../../components/MemberArea';
import { apiGet, memberRequest } from '../../lib/api';
import { PromoPackage, dateTimeVi, dateVi, daysLeft, durationLabel, newKey, promoLabel, vnd } from '../../lib/billing';

type Overview = {
  balance: string;
  subscription: { id: string; name: string; startsAt: string; endsAt: string | null; maxListings: number | null; billingCycle: string; price: string } | null;
  listing: { used: number; limit: number | null };
  history: { id: string; name: string; status: string; price: string; startsAt: string; endsAt: string | null; createdAt: string }[];
  promotions: { id: string; name: string; status: string; price: string; type: string; createdAt: string; productTitle: string | null; endsAt: string | null }[];
};
type Topup = { id: string; code: string; amount: string; status: string; receivedAmount: string | null; createdAt: string; expiresAt: string; rejectReason: string | null; qrUrl: string | null; bank?: Bank };
type Bank = { bankName: string; accountNumber: string; accountName: string };
type NewTopup = Topup & { bank: Bank; qrUrl: string };
type Tx = { id: string; type: string; amount: string; balanceAfter: string; note: string | null; createdAt: string };
type MyListing = { id: string; title: string | null; status: string; productId: string | null };

const PRESETS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];
const TX_LABEL: Record<string, string> = { TOPUP: 'Nạp tiền', SPEND: 'Thanh toán', REFUND: 'Hoàn tiền', ADJUST: 'Điều chỉnh' };
const TOPUP_STATUS: Record<string, [string, string]> = { PENDING: ['Chờ xác nhận', 'wait'], CONFIRMED: ['Đã cộng tiền', 'ok'], REJECTED: ['Bị từ chối', 'bad'], CANCELLED: ['Đã hủy', ''], EXPIRED: ['Hết hạn', ''] };

export default function WalletPage() {
  return <MemberArea>{() => <Suspense fallback={null}><Wallet /></Suspense>}</MemberArea>;
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" className="bl-btn sm" onClick={() => { void navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>{done ? 'Đã chép' : 'Sao chép'}</button>;
}

function Wallet() {
  const params = useSearchParams();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(params.get('bought') ? 'Đã kích hoạt gói thành công. Cảm ơn bạn!' : '');
  const [amount, setAmount] = useState<number>(Number(params.get('topup')) || 200_000);
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<NewTopup | null>(null);
  const [promos, setPromos] = useState<PromoPackage[]>([]);
  const [listings, setListings] = useState<MyListing[]>([]);
  const [productId, setProductId] = useState('');

  const load = useCallback(async () => {
    try {
      const [o, t, x] = await Promise.all([memberRequest<Overview>('/billing/overview'), memberRequest<Topup[]>('/billing/topups'), memberRequest<Tx[]>('/billing/transactions')]);
      setOverview(o); setTopups(t); setTxs(x);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được dữ liệu ví.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    apiGet<PromoPackage[]>('/promotions/packages').then(setPromos).catch(() => undefined);
    memberRequest<MyListing[]>('/listings/mine').then(list => setListings(list.filter(l => l.status === 'PUBLISHED' && l.productId))).catch(() => undefined);
  }, []);
  const hasPending = topups.some(t => t.status === 'PENDING');
  useEffect(() => { if (!hasPending) return; const timer = setInterval(() => void load(), 15000); return () => clearInterval(timer); }, [hasPending, load]);

  async function createTopup() {
    setBusy(true); setError(''); setNotice('');
    try { const result = await memberRequest<NewTopup>('/billing/topups', 'POST', { amount }); setFresh(result); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không tạo được yêu cầu nạp.'); } finally { setBusy(false); }
  }
  async function cancelTopup(id: string) {
    setBusy(true);
    try { await memberRequest(`/billing/topups/${id}/cancel`, 'POST', {}); if (fresh?.id === id) setFresh(null); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Không hủy được.'); } finally { setBusy(false); }
  }
  async function buyPromo(pkg: PromoPackage) {
    if (!productId) { setError('Hãy chọn tin đăng cần đẩy.'); return; }
    if (!window.confirm(`Mua "${pkg.name}" (${vnd(pkg.price)}) cho tin đã chọn?`)) return;
    setBusy(true); setError(''); setNotice('');
    try { await memberRequest('/billing/promotions/purchase', 'POST', { productId, packageId: pkg.id }, newKey()); setNotice(`Đã kích hoạt ${pkg.name}.`); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không mua được gói.'); } finally { setBusy(false); }
  }

  const sub = overview?.subscription; const left = daysLeft(sub?.endsAt);
  const used = overview?.listing.used ?? 0; const limit = overview?.listing.limit ?? null;
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const shown = fresh ?? topups.find(t => t.status === 'PENDING' && t.qrUrl && t.bank) as NewTopup | undefined;

  return <div className="bl">
    <h1>Ví & gói của tôi</h1>
    <p className="sub">Quản lý số dư, nạp tiền, gói đăng tin và các gói đẩy tin.</p>
    {error && <div className="bl-msg err" role="alert">{error}</div>}
    {notice && <div className="bl-msg ok" role="status">{notice}</div>}

    <div className="bl-grid two">
      <div className="bl-card"><h2>Số dư ví</h2>
        <div className="bl-balance"><div className="n">{vnd(overview?.balance)}</div><a href="#nap-tien" className="bl-btn primary">Nạp tiền</a></div>
        <p style={{ color: '#71817b', margin: '8px 0 0' }}>Dùng để mua gói đăng tin và gói đẩy tin.</p></div>
      <div className="bl-card"><h2>Gói đăng tin hiện tại</h2>
        {sub ? <>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{sub.name}</div>
          <div style={{ color: '#71817b' }}>Hiệu lực đến <b>{dateVi(sub.endsAt)}</b>{left !== null && <> · còn <b style={{ color: left <= 7 ? '#b53434' : '#007c4b' }}>{left} ngày</b></>}</div>
        </> : <div style={{ fontSize: 18, fontWeight: 800 }}>Gói miễn phí</div>}
        <div style={{ marginTop: 12, fontSize: 13 }}>Tin đang có: <b>{used}</b> / {limit === null ? 'không giới hạn' : limit}</div>
        {limit !== null && <div className="bl-bar"><i className={pct >= 100 ? 'full' : pct >= 80 ? 'warn' : ''} style={{ width: pct + '%' }} /></div>}
        <Link href="/goi-dich-vu" className="bl-btn sm" style={{ marginTop: 6 }}>{sub ? 'Gia hạn / đổi gói' : 'Nâng cấp gói'}</Link></div>
    </div>

    <div className="bl-card" id="nap-tien"><h2>Nạp tiền vào ví</h2>
      <div className="bl-chips">{PRESETS.map(p => <button key={p} type="button" className={`bl-chip ${amount === p ? 'on' : ''}`} onClick={() => setAmount(p)}>{vnd(p)}</button>)}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="bl-in" type="number" min={10000} step={1000} value={amount} onChange={e => setAmount(Math.trunc(Number(e.target.value)) || 0)} aria-label="Số tiền nạp" />
        <button type="button" className="bl-btn primary" disabled={busy || amount < 10_000} onClick={createTopup}>Tạo mã nạp tiền</button>
      </div>
      <small style={{ color: '#7a8b82' }}>Tối thiểu 10.000 đ, tối đa 50.000.000 đ mỗi lần.</small>
      {shown && shown.bank && <div className="bl-qr" style={{ marginTop: 18 }}>
        <img src={shown.qrUrl ?? ''} alt="Mã QR chuyển khoản" />
        <div>
          <div className="bl-msg info">Quét mã QR bằng ứng dụng ngân hàng hoặc chuyển khoản <b>đúng số tiền</b> và <b>đúng nội dung</b>. Quản trị viên sẽ xác nhận và cộng tiền vào ví (thường trong ít phút giờ hành chính).</div>
          <div className="bl-kv">
            <b>Ngân hàng</b><span className="v">{shown.bank.bankName}</span><span />
            <b>Số tài khoản</b><span className="v">{shown.bank.accountNumber}</span><Copy text={shown.bank.accountNumber} />
            <b>Chủ tài khoản</b><span className="v">{shown.bank.accountName}</span><span />
            <b>Số tiền</b><span className="v">{vnd(shown.amount)}</span><Copy text={String(shown.amount)} />
            <b>Nội dung</b><span className="v">{shown.code}</span><Copy text={shown.code} />
          </div>
          <p style={{ color: '#71817b', fontSize: 12 }}>Mã hết hạn {dateTimeVi(shown.expiresAt)}. Trang tự cập nhật khi tiền được cộng.</p>
        </div>
      </div>}
      {topups.length > 0 && <table className="bl-tbl" style={{ marginTop: 18 }}><thead><tr><th>Mã</th><th>Số tiền</th><th>Ngày tạo</th><th>Trạng thái</th><th /></tr></thead><tbody>
        {topups.map(t => { const [label, cls] = TOPUP_STATUS[t.status] ?? [t.status, '']; return <tr key={t.id}><td><b>{t.code}</b></td><td>{vnd(t.amount)}</td><td>{dateTimeVi(t.createdAt)}</td>
          <td><span className={`bl-pill ${cls}`}>{label}</span>{t.rejectReason && <div style={{ color: '#a64329', fontSize: 12 }}>{t.rejectReason}</div>}</td>
          <td>{t.status === 'PENDING' && <button className="bl-btn sm" disabled={busy} onClick={() => cancelTopup(t.id)}>Hủy</button>}</td></tr>; })}</tbody></table>}
    </div>

    <div className="bl-card" id="day-tin"><h2>Đẩy tin & tin nổi bật</h2>
      {!listings.length ? <p style={{ color: '#71817b' }}>Bạn chưa có tin đang hiển thị. <Link href="/sell" style={{ color: '#007c4b', fontWeight: 700 }}>Đăng tin ngay</Link></p> : <>
        <div className="bl-f" style={{ marginBottom: 14 }}><label htmlFor="promo-listing" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Chọn tin cần đẩy</label>
          <select id="promo-listing" className="bl-in" style={{ maxWidth: 480 }} value={productId} onChange={e => setProductId(e.target.value)}><option value="">— Chọn tin đăng —</option>{listings.map(l => <option key={l.id} value={l.productId ?? ''}>{l.title || '(Chưa đặt tiêu đề)'}</option>)}</select></div>
        <div className="bl-grid plans">{promos.map(p => <div key={p.id} className="bl-plan"><div className="name">{p.name}</div><div><span className="bl-pill ok">{promoLabel(p.promotion_type)}</span></div>
          <div className="bl-price" style={{ fontSize: 24 }}>{vnd(p.price)}<small> / {durationLabel(p.duration_hours)}</small></div>
          <button className="bl-btn primary" disabled={busy || !productId} onClick={() => buyPromo(p)}>Mua gói này</button></div>)}</div></>}
      {!!overview?.promotions.length && <table className="bl-tbl" style={{ marginTop: 16 }}><thead><tr><th>Gói</th><th>Tin đăng</th><th>Giá</th><th>Hết hạn</th></tr></thead><tbody>
        {overview.promotions.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.productTitle ?? '—'}</td><td>{vnd(p.price)}</td><td>{p.status === 'PAID' ? dateTimeVi(p.endsAt) : p.status}</td></tr>)}</tbody></table>}
    </div>

    <div className="bl-card"><h2>Lịch sử giao dịch ví</h2>
      {txs.length ? <table className="bl-tbl"><thead><tr><th>Thời gian</th><th>Loại</th><th>Nội dung</th><th>Số tiền</th><th>Số dư sau</th></tr></thead><tbody>
        {txs.map(t => <tr key={t.id}><td>{dateTimeVi(t.createdAt)}</td><td>{TX_LABEL[t.type] ?? t.type}</td><td>{t.note ?? ''}</td><td className={Number(t.amount) >= 0 ? 'bl-pos' : 'bl-neg'}>{Number(t.amount) >= 0 ? '+' : ''}{vnd(t.amount)}</td><td>{vnd(t.balanceAfter)}</td></tr>)}</tbody></table>
        : <p style={{ color: '#71817b' }}>Chưa có giao dịch nào.</p>}
    </div>

    {!!overview?.history.length && <div className="bl-card"><h2>Lịch sử mua gói đăng tin</h2><table className="bl-tbl"><thead><tr><th>Gói</th><th>Giá</th><th>Bắt đầu</th><th>Hết hạn</th><th>Trạng thái</th></tr></thead><tbody>
      {overview.history.map(h => <tr key={h.id}><td>{h.name}</td><td>{vnd(h.price)}</td><td>{dateVi(h.startsAt)}</td><td>{dateVi(h.endsAt)}</td><td>{h.status === 'ACTIVE' && h.endsAt && new Date(h.endsAt) < new Date() ? 'Hết hạn' : h.status === 'ACTIVE' ? 'Đang dùng' : h.status === 'CANCELLED' ? 'Đã thay/hủy' : h.status}</td></tr>)}</tbody></table></div>}
  </div>;
}
