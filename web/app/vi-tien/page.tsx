'use client';
import '../goi-dich-vu/billing.css';
import Link from 'next/link';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemberArea } from '../../components/MemberArea';
import { memberRequest } from '../../lib/api';
import { dateTimeVi, vnd } from '../../lib/billing';
import { MoneyInput } from '../../components/MoneyInput';
import { ErrorDialog } from '../../components/ErrorDialog';
import { CelebrationDialog, type CelebrationKind } from '../../components/CelebrationDialog';
import { COIN_NOTE, COIN_TERMS, coin, previewDeposit } from '../../lib/coin';

type Overview = {
  balance: string;
  subscription: { id: string; name: string; startsAt: string; endsAt: string | null; maxListings: number | null; billingCycle: string; price: string } | null;
  listing: { used: number; limit: number | null };
  history: { id: string; name: string; status: string; price: string; startsAt: string; endsAt: string | null; createdAt: string }[];
  promotions: { id: string; name: string; status: string; price: string; type: string; createdAt: string; productTitle: string | null; endsAt: string | null }[];
};
type Topup = { id: string; code: string; coinAmount?: string; vatAmount?: string; amount: string; status: string; receivedAmount: string | null; createdAt: string; expiresAt: string; rejectReason: string | null; qrUrl: string | null; bank?: Bank | null; provider?: string; checkoutUrl?: string | null };
type Bank = { bankName: string; accountNumber: string; accountName: string };
type NewTopup = Topup & { bank: Bank | null; qrUrl: string | null };
type Tx = { id: string; type: string; amount: string; balanceAfter: string; description: string | null; createdAt: string; direction: 'CREDIT' | 'DEBIT'; amountVnd: string | null };
type WalletSum = { coinBalance: number; totalDeposited: number; totalSpent: number };
const TX_FILTERS: [string, string][] = [['ALL', 'Tất cả'], ['DEPOSIT', 'Nạp Coin'], ['PURCHASE', 'Mua gói'], ['REFUND', 'Hoàn'], ['PROMOTION', 'Khuyến mãi']];

const PRESETS = [50_000, 100_000, 200_000, 500_000, 1_000_000];
const TX_LABEL: Record<string, string> = { TOPUP: 'Nạp TTTCoin', SPEND: 'Thanh toán bằng TTTCoin', REFUND: 'Hoàn', ADJUST: 'Điều chỉnh', BONUS: 'Khuyến mãi' };
const TOPUP_STATUS: Record<string, [string, string]> = { PENDING: ['Chờ xác nhận', 'wait'], CONFIRMED: ['Thành công', 'ok'], REFUNDED: ['Đã hoàn', ''], REJECTED: ['Bị từ chối', 'bad'], CANCELLED: ['Đã hủy', ''], EXPIRED: ['Hết hạn', ''] };

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
  const [sum, setSum] = useState<WalletSum | null>(null);
  const [txFilter, setTxFilter] = useState('ALL');
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [txLoading, setTxLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [celebrate, setCelebrate] = useState<{ kind: CelebrationKind; amount?: string } | null>(null);
  const prevTopups = useRef<Record<string, string> | null>(null);
  const [amount, setAmount] = useState<number>(Math.max(10_000, Number(params.get('topup')) || 200_000));
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<NewTopup | null>(null);

  const load = useCallback(async () => {
    try {
      const [o, t, w] = await Promise.all([memberRequest<Overview>('/billing/overview'), memberRequest<Topup[]>('/billing/topups'), memberRequest<WalletSum>('/wallet')]);
      setOverview(o); setTopups(t); setSum(w);
      // Phát hiện yêu cầu nạp vừa được quản trị viên xác nhận → chúc mừng.
      const prev = prevTopups.current;
      if (prev) { const done = t.find(r => r.status === 'CONFIRMED' && prev[r.id] && prev[r.id] !== 'CONFIRMED'); if (done) setCelebrate({ kind: 'topup', amount: '+' + coin(done.coinAmount ?? done.amount) }); }
      prevTopups.current = Object.fromEntries(t.map(r => [r.id, r.status]));
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được dữ liệu ví.'); }
  }, []);
  const loadTxs = useCallback(async () => {
    setTxLoading(true);
    try { const r = await memberRequest<{ items: Tx[]; total: number }>(`/wallet/transactions?filter=${txFilter}&page=${txPage}&limit=10`); setTxs(r.items); setTxTotal(r.total); }
    catch { setTxs([]); } finally { setTxLoading(false); }
  }, [txFilter, txPage]);
  const confirmedCount = topups.filter(t => t.status === 'CONFIRMED').length;
  useEffect(() => { void loadTxs(); }, [loadTxs, confirmedCount]);
  useEffect(() => { void load(); }, [load]);
  const hasPending = topups.some(t => t.status === 'PENDING');
  const payosPending = topups.filter(t => t.status === 'PENDING' && t.provider === 'PAYOS');
  const payosKey = payosPending.map(t => t.id).join(',');
  useEffect(() => {
    if (!hasPending) return;
    // PayOS: hỏi cổng mỗi 5 giây (phòng khi webhook chưa tới); chuyển khoản thủ công: tải lại mỗi 15 giây.
    const timer = setInterval(() => { void (async () => { await Promise.all(payosKey.split(',').filter(Boolean).map(id => memberRequest(`/billing/topups/${id}/sync`, 'POST', {}).catch(() => undefined))); await load(); })(); }, payosKey ? 5000 : 15000);
    return () => clearInterval(timer);
  }, [hasPending, payosKey, load]);

  async function createTopup() {
    if (amount < 10_000) { setError('Số tiền nạp tối thiểu là 10.000 đ.'); return; }
    if (amount > 50_000_000) { setError('Số tiền nạp tối đa là 50.000.000 đ mỗi lần.'); return; }
    if (!agreed) { setError('Vui lòng đọc và đồng ý với quy định TTTCoin trước khi nạp.'); return; }
    setBusy(true); setError(''); setNotice('');
    try { const result = await memberRequest<NewTopup>('/wallet/coin/deposit', 'POST', { amount }); setFresh(result); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không tạo được yêu cầu nạp.'); } finally { setBusy(false); }
  }
  async function cancelTopup(id: string) {
    setBusy(true);
    try { await memberRequest(`/billing/topups/${id}/cancel`, 'POST', {}); if (fresh?.id === id) setFresh(null); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Không hủy được.'); } finally { setBusy(false); }
  }
  const shown = ((fresh && topups.find(t => t.id === fresh.id)?.status === 'PENDING') ? fresh : topups.find(t => t.status === 'PENDING' && (t.qrUrl || t.checkoutUrl))) as NewTopup | undefined;

  return <div className="bl">
    <h1>Ví TTTCoin</h1>
    <p className="sub">Quản lý số dư, nạp TTTCoin và xem lịch sử giao dịch. Cần mua gói? Vào mục <Link href="/vi-tien/mua-goi" style={{ color: '#007c4b', fontWeight: 700 }}>Mua gói</Link>.</p>
    {celebrate && <CelebrationDialog kind={celebrate.kind} amount={celebrate.amount} onClose={() => setCelebrate(null)} />}
    <ErrorDialog message={error} title="Chưa thực hiện được" onClose={() => setError('')} />
    {notice && <div className="bl-msg ok" role="status">{notice}</div>}

    <div className="bl-grid two">
      <div className="bl-card"><h2>Ví TTTCoin</h2>
        <div className="bl-balance"><div className="n">{coin(overview?.balance)}</div><a href="#nap-tien" className="bl-btn primary">Nạp TTTCoin</a><a href="#lich-su" className="bl-btn sm">Lịch sử giao dịch</a></div>
        <p style={{ color: '#71817b', margin: '8px 0 0' }}>Tổng đã nạp: <b>{coin(sum?.totalDeposited)}</b> · Tổng đã sử dụng: <b>{coin(sum?.totalSpent)}</b></p>
        <p style={{ color: '#71817b', margin: '4px 0 0', fontSize: 13 }}>Dùng để mua gói đăng tin và gói đẩy tin. <Link href="/vi-tien/mua-goi" style={{ color: '#007c4b', fontWeight: 700 }}>Mua gói →</Link></p></div>
    </div>

    <div className="bl-card" id="nap-tien"><h2>Nạp TTTCoin</h2>
      <div className="bl-chips">{PRESETS.map(p => <button key={p} type="button" className={`bl-chip ${amount === p ? 'on' : ''}`} onClick={() => setAmount(p)}>{vnd(p)}</button>)}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <MoneyInput className="bl-in" value={amount || ''} onChange={d => setAmount(Number(d) || 0)} aria-label="Số tiền nạp" />
        <button type="button" className="bl-btn primary" disabled={busy} onClick={createTopup}>{busy ? 'Đang tạo mã…' : 'NẠP TTTCoin'}</button>
      </div>
      <small style={{ color: amount > 0 && amount < 10_000 ? '#b53434' : '#7a8b82' }}>Tối thiểu 10.000 đ, tối đa 50.000.000 đ mỗi lần.{amount > 0 && amount < 10_000 ? ' Hãy nhập ít nhất 10.000 đ để tạo mã.' : ''}</small>
      {amount >= 10_000 && (() => { const q = previewDeposit(amount); return <table className="bl-tbl" style={{ maxWidth: 420, marginTop: 12 }}><tbody>
        <tr><td>Số tiền thanh toán</td><td style={{ textAlign: 'right' }}>{vnd(q.amount)}</td></tr>
        <tr><td>Giá trị trước VAT</td><td style={{ textAlign: 'right' }}>{vnd(q.amountBeforeVat)}</td></tr>
        <tr><td>Thuế GTGT 8%</td><td style={{ textAlign: 'right' }}>{vnd(q.vatAmount)}</td></tr>
        <tr><td><b>Bạn nhận được</b></td><td style={{ textAlign: 'right' }}><b className="bl-pos">{coin(q.coinAmount)}</b></td></tr></tbody></table>; })()}
      <p style={{ color: '#71817b', fontSize: 13, margin: '10px 0 0' }}>{COIN_NOTE}</p>
      <ul style={{ color: '#71817b', fontSize: 12.5, margin: '6px 0 8px', paddingLeft: 18 }}>{COIN_TERMS.map(t => <li key={t}>{t}</li>)}</ul>
      <label style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, alignItems: 'center', fontSize: 13, margin: '0 0 10px', width: 'fit-content' }}><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: 18, height: 18, margin: 0, padding: 0, flex: 'none' }} />Tôi đã đọc và đồng ý với quy định TTTCoin.</label>
      {shown && !shown.bank && shown.checkoutUrl && <div className="bl-msg info" style={{ marginTop: 18 }}>Mã nạp <b>{shown.code}</b> đã sẵn sàng. <a href={shown.checkoutUrl} target="_blank" rel="noreferrer" className="bl-btn sm primary">Mở trang thanh toán PayOS</a></div>}
      {shown && shown.bank && <div className="bl-qr" style={{ marginTop: 18 }}>
        <img src={shown.qrUrl ?? ''} alt="Mã QR chuyển khoản" />
        <div>
          <div className="bl-msg info">{shown.provider === 'PAYOS' ? <>Quét mã QR bằng ứng dụng ngân hàng và thanh toán <b>đúng số tiền</b>. Tiền sẽ được <b>cộng vào ví tự động</b> ngay khi thanh toán xong (thường trong vài giây).</> : <>Quét mã QR bằng ứng dụng ngân hàng hoặc chuyển khoản <b>đúng số tiền</b> và <b>đúng nội dung</b>. Quản trị viên sẽ xác nhận và cộng tiền vào ví (thường trong ít phút giờ hành chính).</>}</div>
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
      {topups.length > 0 && <table className="bl-tbl" style={{ marginTop: 18 }}><thead><tr><th>Mã</th><th>Số tiền</th><th>TTTCoin</th><th>Ngày tạo</th><th>Trạng thái</th><th /></tr></thead><tbody>
        {topups.map(t => { const [label, cls] = TOPUP_STATUS[t.status] ?? [t.status, '']; return <tr key={t.id}><td><b>{t.code}</b></td><td>{vnd(t.amount)}</td><td>{coin(t.coinAmount)}</td><td>{dateTimeVi(t.createdAt)}</td>
          <td><span className={`bl-pill ${cls}`}>{label}</span>{t.rejectReason && <div style={{ color: '#a64329', fontSize: 12 }}>{t.rejectReason}</div>}</td>
          <td>{t.status === 'PENDING' && <button className="bl-btn sm" disabled={busy} onClick={() => cancelTopup(t.id)}>Hủy</button>}</td></tr>; })}</tbody></table>}
    </div>

    <div className="bl-card" id="lich-su"><h2>Lịch sử giao dịch TTTCoin</h2>
      <div className="bl-chips">{TX_FILTERS.map(([k, l]) => <button key={k} type="button" className={`bl-chip ${txFilter === k ? 'on' : ''}`} onClick={() => { setTxFilter(k); setTxPage(1); }}>{l}</button>)}</div>
      {txLoading ? <p style={{ color: '#71817b' }}>Đang tải…</p> : txs.length ? <div style={{ display: 'grid', gap: 8 }}>
        {txs.map(t => { const credit = t.direction === 'CREDIT'; return <div key={t.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: '1px solid #e3ece7', borderRadius: 12, padding: '10px 12px' }}>
          <span aria-hidden style={{ width: 34, height: 34, borderRadius: 17, display: 'grid', placeItems: 'center', fontWeight: 800, background: credit ? '#e6f6ed' : '#fdecec', color: credit ? '#007c4b' : '#b53434' }}>{credit ? '↓' : '↑'}</span>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700 }}>{TX_LABEL[t.type] ?? t.type}{t.amountVnd ? <span style={{ fontWeight: 500, color: '#71817b' }}> · {vnd(t.amountVnd)}</span> : null}</div>
            <div style={{ color: '#71817b', fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description ?? ''}</div>
            <div style={{ color: '#71817b', fontSize: 12 }}>Thành công · {dateTimeVi(t.createdAt)}</div></div>
          <div className={credit ? 'bl-pos' : 'bl-neg'} style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{credit ? '+' : '-'}{coin(Math.abs(Number(t.amount)))}</div></div>; })}</div>
        : <p style={{ color: '#71817b' }}>Chưa có giao dịch nào.</p>}
      {txTotal > 10 && <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}><button className="bl-btn sm" disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>Trước</button><span>Trang {txPage}/{Math.ceil(txTotal / 10)}</span><button className="bl-btn sm" disabled={txPage >= Math.ceil(txTotal / 10)} onClick={() => setTxPage(p => p + 1)}>Sau</button></div>}
    </div>

  </div>;
}
