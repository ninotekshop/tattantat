'use client';
import './billing.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, memberRequest } from '../../lib/api';
import { readSession } from '../../lib/auth';
import { Plan, PromoPackage, dateVi, durationLabel, featureList, newKey, planLabel, FREE_PLAN_LABEL, promoLabel, vnd } from '../../lib/billing';

type Overview = { balance: string; subscription: { name: string; endsAt: string | null } | null };

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [promos, setPromos] = useState<PromoPackage[]>([]);
  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState('');
  const [missing, setMissing] = useState<number | null>(null);
  // Thanh toán bằng mã QR: tạo mã PayOS đúng bằng giá gói; khi tiền về thì tự mua gói (tiền vào ví rồi trừ ngay cho gói).
  type QrTopup = { id: string; code: string; amount: string; expiresAt: string; qrUrl: string | null; checkoutUrl?: string | null; bank?: { bankName: string; accountNumber: string; accountName: string } | null };
  const [qr, setQr] = useState<QrTopup | null>(null);
  const [qrState, setQrState] = useState<'idle' | 'waiting' | 'buying'>('idle');
  const buyKey = useRef(newKey());

  useEffect(() => {
    Promise.all([apiGet<Plan[]>('/subscriptions/plans'), apiGet<PromoPackage[]>('/promotions/packages')])
      .then(([p, k]) => { setPlans(p); setPromos(k); if (!p.some(x => x.billing_cycle === 'MONTHLY') && p.some(x => x.billing_cycle === 'YEARLY')) setCycle('YEARLY'); })
      .catch(e => setError(e instanceof Error ? e.message : 'Không tải được bảng giá.'))
      .finally(() => setLoading(false));
    if (readSession()) memberRequest<Overview>('/billing/overview').then(setOverview).catch(() => undefined);
  }, []);

  const shown = useMemo(() => plans.filter(p => p.billing_cycle === cycle), [plans, cycle]);
  const hasBoth = plans.some(p => p.billing_cycle === 'MONTHLY') && plans.some(p => p.billing_cycle === 'YEARLY');
  const popular = shown.length > 2 ? shown[Math.floor(shown.length / 2)]?.id : shown.length === 2 ? shown[1].id : '';

  function start(plan: Plan) {
    if (!readSession()) { router.push('/login?next=/goi-dich-vu'); return; }
    setModalError(''); setMissing(null); setBuying(plan);
  }
  async function confirm() {
    if (!buying) return;
    setBusy(true); setModalError(''); setMissing(null);
    try {
      await memberRequest('/billing/subscriptions/purchase', 'POST', { planId: buying.id }, newKey());
      router.push('/vi-tien?bought=plan');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể mua gói.';
      setModalError(message);
      const m = /nạp thêm ([\d.]+)/.exec(message); if (m) setMissing(Number(m[1].replace(/\./g, '')));
    } finally { setBusy(false); }
  }
  const balance = Number(overview?.balance ?? 0);

  function closeModal() { setBuying(null); setQr(null); setQrState('idle'); }
  async function payByQr() {
    if (!buying) return;
    setBusy(true); setModalError('');
    try {
      const need = Math.max(10_000, Math.ceil(Number(buying.price)));  // thanh toán đủ giá gói bằng QR, không trừ số dư ví hiện có
      const t = await memberRequest<QrTopup>('/billing/topups', 'POST', { amount: need });
      buyKey.current = newKey(); setQr(t); setQrState('waiting');
    } catch (e) { setModalError(e instanceof Error ? e.message : 'Không tạo được mã QR.'); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    if (!qr || !buying || qrState !== 'waiting') return;
    let stop = false;
    const tick = async () => {
      try {
        await memberRequest(`/billing/topups/${qr.id}/sync`, 'POST', {}).catch(() => undefined);
        const list = await memberRequest<Array<{ id: string; status: string }>>('/billing/topups');
        const me = list.find(x => x.id === qr.id);
        if (stop || !me) return;
        if (me.status === 'CONFIRMED') {
          setQrState('buying');
          try { await memberRequest('/billing/subscriptions/purchase', 'POST', { planId: buying.id }, buyKey.current); router.push('/vi-tien?bought=plan'); }
          catch (e) { setQrState('idle'); setQr(null); setModalError((e instanceof Error ? e.message : 'Không thể mua gói.') + ' Tiền đã được cộng vào ví, bạn bấm "Thanh toán bằng ví" để hoàn tất.'); memberRequest<Overview>('/billing/overview').then(setOverview).catch(() => undefined); }
        } else if (me.status !== 'PENDING') { setQrState('idle'); setQr(null); setModalError('Mã QR đã hết hạn hoặc bị hủy. Vui lòng tạo mã mới.'); }
      } catch { /* thử lại ở lần sau */ }
    };
    const timer = setInterval(() => void tick(), 4000);
    return () => { stop = true; clearInterval(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr, qrState, buying]);

  return <main className="bl">
    <h1>Gói dịch vụ dành cho người bán</h1>
    <p className="sub">Đăng nhiều tin hơn, bán nhanh hơn. Thanh toán bằng số dư ví, nạp tiền nhanh qua QR chuyển khoản.</p>
    {error && <div className="bl-msg err">{error}</div>}
    {overview?.subscription && <div className="bl-msg ok">Bạn đang dùng <b>{planLabel(overview.subscription.name)}</b>{overview.subscription.endsAt ? `, hết hạn ${dateVi(overview.subscription.endsAt)}` : ''}. Mua lại đúng gói sẽ được cộng dồn thời hạn; đổi sang gói khác sẽ áp dụng ngay.</div>}
    {hasBoth && <div className="bl-toggle" role="tablist"><button className={cycle === 'MONTHLY' ? 'on' : ''} onClick={() => setCycle('MONTHLY')}>Theo tháng</button><button className={cycle === 'YEARLY' ? 'on' : ''} onClick={() => setCycle('YEARLY')}>Theo năm</button></div>}
    {loading && <p>Đang tải bảng giá…</p>}
    <div className="bl-grid plans">
      {!shown.some(p => planLabel(p.name) === FREE_PLAN_LABEL) && <div className="bl-plan"><div className="name">{FREE_PLAN_LABEL}</div><div className="bl-price">0 đ</div>
        <ul><li>Đăng tối đa 10 tin cùng lúc</li><li>Hiển thị tin cơ bản</li><li>Chat trực tiếp với người mua</li></ul>
        <Link href="/sell" className="bl-btn">Đăng tin ngay</Link></div>}
      {shown.map(plan => {
        const perks = featureList(plan.features);
        return <div key={plan.id} className={`bl-plan ${plan.id === popular ? 'hot' : ''}`}>
          {plan.id === popular && <span className="ribbon">Phổ biến</span>}
          <div className="name">{planLabel(plan.name)}</div>
          <div className="bl-price">{vnd(plan.price)}<small> / {plan.billing_cycle === 'YEARLY' ? 'năm' : 'tháng'}</small></div>
          <ul><li>{plan.max_listings === null ? 'Đăng tin không giới hạn' : `Đăng tối đa ${plan.max_listings} tin cùng lúc`}</li>{perks.map(f => <li key={f}>{f}</li>)}</ul>
          <button className={`bl-btn ${plan.id === popular ? 'primary' : ''}`} onClick={() => start(plan)}>Mua gói</button>
        </div>;
      })}
    </div>
    {!loading && !shown.length && !error && <p style={{ color: '#71817b' }}>Chưa có gói trả phí nào được mở bán.</p>}

    <div className="bl-card" style={{ marginTop: 28 }}>
      <h2>Gói đẩy tin & tin nổi bật</h2>
      <p className="sub" style={{ marginTop: -6 }}>Mua cho từng tin đăng để tiếp cận nhiều người mua hơn. Chọn tin trong trang <Link href="/vi-tien#day-tin" style={{ color: '#007c4b', fontWeight: 700 }}>Ví & gói của tôi</Link>.</p>
      <div className="bl-grid plans">{promos.map(p => <div key={p.id} className="bl-plan"><div className="name">{p.name}</div><div><span className="bl-pill ok">{promoLabel(p.promotion_type)}</span></div>
        <div className="bl-price">{vnd(p.price)}<small> / {durationLabel(p.duration_hours)}</small></div>
        <Link className="bl-btn" href="/vi-tien#day-tin">Chọn tin để đẩy</Link></div>)}
        {!promos.length && !loading && <p style={{ color: '#71817b' }}>Chưa có gói đẩy tin.</p>}</div>
    </div>

    <div className="bl-card bl-faq"><h2>Câu hỏi thường gặp</h2>
      <details><summary>Thanh toán như thế nào?</summary><p>Bạn nạp tiền vào ví bằng cách quét mã QR hoặc chuyển khoản theo nội dung hệ thống cung cấp. Sau khi quản trị viên xác nhận, số dư được cộng vào ví và dùng để mua gói.</p></details>
      <details><summary>Mua lại gói khi chưa hết hạn thì sao?</summary><p>Mua lại đúng gói đang dùng sẽ được cộng dồn thêm thời hạn. Đổi sang gói khác sẽ áp dụng ngay và thay thế gói cũ.</p></details>
      <details><summary>Hết hạn gói thì tin đăng có mất không?</summary><p>Tin đã đăng không bị xóa, nhưng bạn không thể đăng thêm nếu số tin vượt hạn mức miễn phí.</p></details>
    </div>

    {buying && <div className="bl-modal" onClick={() => !busy && qrState !== 'buying' && closeModal()}><div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" style={{ position: 'relative', ...(qr ? { maxWidth: 560 } : {}) }}>
      <button type="button" aria-label="Đóng" disabled={busy || qrState === 'buying'} onClick={closeModal} style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '50%', background: '#f1f5f9', color: '#475569', fontSize: 20, lineHeight: 1, cursor: 'pointer' }}>✕</button>
      <h2 style={{ marginTop: 0, paddingRight: 36 }}>Xác nhận mua gói</h2>
      <p><b>{planLabel(buying.name)}</b> — {vnd(buying.price)} / {buying.billing_cycle === 'YEARLY' ? 'năm' : 'tháng'}</p>
      <p>Số dư ví hiện tại: <b>{vnd(balance)}</b></p>
      {qr ? <>
        <div className="bl-qr">
          {qr.qrUrl ? <img src={qr.qrUrl} alt="Mã QR thanh toán" /> : null}
          <div>
            <div className="bl-msg info">{qrState === 'buying' ? 'Đã nhận tiền, đang kích hoạt gói…' : <>Quét mã QR bằng ứng dụng ngân hàng và thanh toán <b>đúng số tiền {vnd(qr.amount)}</b>. Gói sẽ được <b>kích hoạt tự động</b> ngay khi nhận được tiền.</>}</div>
            {qr.bank && <div className="bl-kv"><b>Ngân hàng</b><span className="v">{qr.bank.bankName}</span><span /><b>Số tài khoản</b><span className="v">{qr.bank.accountNumber}</span><span /><b>Nội dung</b><span className="v">{qr.code}</span><span /></div>}
            {qr.checkoutUrl && !qr.bank && <a href={qr.checkoutUrl} target="_blank" rel="noreferrer" className="bl-btn sm primary">Mở trang thanh toán PayOS</a>}
            <p style={{ color: '#71817b', fontSize: 12 }}>Đang chờ thanh toán… Vui lòng không đóng trang này.</p>
          </div>
        </div>
        {modalError && <div className="bl-msg err">{modalError}</div>}
      </> : <>
        {Number(buying.price) > balance && <div className="bl-msg info">Số dư chưa đủ, bạn cần nạp thêm <b>{vnd(Number(buying.price) - balance)}</b>.</div>}
        {modalError && <div className="bl-msg err">{modalError}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Number(buying.price) <= balance && !missing && <button className="bl-btn primary" disabled={busy} onClick={confirm}>{busy ? 'Đang xử lý…' : 'Thanh toán bằng ví'}</button>}
          <button className={`bl-btn ${Number(buying.price) > balance || missing ? 'primary' : ''}`} disabled={busy} onClick={payByQr}>{busy ? 'Đang tạo mã…' : 'Thanh toán bằng mã QR'}</button>
        </div>
      </>}
    </div></div>}
  </main>;
}
