'use client';
import './billing.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, memberRequest } from '../../lib/api';
import { readSession } from '../../lib/auth';
import { Plan, PromoPackage, dateVi, durationLabel, featureList, newKey, promoLabel, vnd } from '../../lib/billing';

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

  return <main className="bl">
    <h1>Gói dịch vụ dành cho người bán</h1>
    <p className="sub">Đăng nhiều tin hơn, bán nhanh hơn. Thanh toán bằng số dư ví, nạp tiền nhanh qua QR chuyển khoản.</p>
    {error && <div className="bl-msg err">{error}</div>}
    {overview?.subscription && <div className="bl-msg ok">Bạn đang dùng <b>{overview.subscription.name}</b>{overview.subscription.endsAt ? `, hết hạn ${dateVi(overview.subscription.endsAt)}` : ''}. Mua lại đúng gói sẽ được cộng dồn thời hạn; đổi sang gói khác sẽ áp dụng ngay.</div>}
    {hasBoth && <div className="bl-toggle" role="tablist"><button className={cycle === 'MONTHLY' ? 'on' : ''} onClick={() => setCycle('MONTHLY')}>Theo tháng</button><button className={cycle === 'YEARLY' ? 'on' : ''} onClick={() => setCycle('YEARLY')}>Theo năm</button></div>}
    {loading && <p>Đang tải bảng giá…</p>}
    <div className="bl-grid plans">
      <div className="bl-plan"><div className="name">Miễn phí</div><div className="bl-price">0 đ</div>
        <ul><li>Đăng tối đa 10 tin cùng lúc</li><li>Hiển thị tin cơ bản</li><li>Chat trực tiếp với người mua</li></ul>
        <Link href="/sell" className="bl-btn">Đăng tin ngay</Link></div>
      {shown.map(plan => {
        const perks = featureList(plan.features);
        return <div key={plan.id} className={`bl-plan ${plan.id === popular ? 'hot' : ''}`}>
          {plan.id === popular && <span className="ribbon">Phổ biến</span>}
          <div className="name">{plan.name}</div>
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

    {buying && <div className="bl-modal" onClick={() => !busy && setBuying(null)}><div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
      <h2 style={{ marginTop: 0 }}>Xác nhận mua gói</h2>
      <p><b>{buying.name}</b> — {vnd(buying.price)} / {buying.billing_cycle === 'YEARLY' ? 'năm' : 'tháng'}</p>
      <p>Số dư ví hiện tại: <b>{vnd(balance)}</b></p>
      {Number(buying.price) > balance && <div className="bl-msg info">Số dư chưa đủ, bạn cần nạp thêm <b>{vnd(Number(buying.price) - balance)}</b>.</div>}
      {modalError && <div className="bl-msg err">{modalError}</div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {Number(buying.price) > balance || missing
          ? <Link className="bl-btn primary" href={`/vi-tien?topup=${Math.max(missing ?? 0, Number(buying.price) - balance)}#nap-tien`}>Nạp tiền</Link>
          : <button className="bl-btn primary" disabled={busy} onClick={confirm}>{busy ? 'Đang xử lý…' : 'Thanh toán bằng ví'}</button>}
        <button className="bl-btn" disabled={busy} onClick={() => setBuying(null)}>Đóng</button>
      </div>
    </div></div>}
  </main>;
}
