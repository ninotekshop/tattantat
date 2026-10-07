'use client';
import './billing.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiGet, memberRequest } from '../../lib/api';
import { readSession } from '../../lib/auth';
import { PromoGuide } from '../../components/PromoGuide';
import { PayModal } from '../../components/PayModal';
import { coin } from '../../lib/coin';
import { Plan, PromoPackage, dateVi, durationLabel, featureList, planLabel, FREE_PLAN_LABEL, promoDesc, promoLabel } from '../../lib/billing';

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
    setBuying(plan);
  }
  const balance = Number(overview?.balance ?? 0);

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
          <div className="bl-price">{coin(plan.price)}<small> / {plan.billing_cycle === 'YEARLY' ? 'năm' : 'tháng'}</small></div>
          <ul><li>{plan.max_listings === null ? 'Đăng tin không giới hạn' : `Đăng tối đa ${plan.max_listings} tin cùng lúc`}</li>{perks.map(f => <li key={f}>{f}</li>)}</ul>
          <button className={`bl-btn ${plan.id === popular ? 'primary' : ''}`} onClick={() => start(plan)}>Mua gói</button>
        </div>;
      })}
    </div>
    {!loading && !shown.length && !error && <p style={{ color: '#71817b' }}>Chưa có gói trả phí nào được mở bán.</p>}

    <div className="bl-card" style={{ marginTop: 28 }}>
      <h2>Gói đẩy tin & tin nổi bật</h2>
      <p className="sub" style={{ marginTop: -6 }}>Mua cho từng tin đăng để tiếp cận nhiều người mua hơn. Chọn tin trong trang <Link href="/vi-tien/mua-goi#day-tin" style={{ color: '#007c4b', fontWeight: 700 }}>Ví & gói của tôi</Link>.</p>
      <PromoGuide />
        <div className="bl-grid plans">{promos.map(p => <div key={p.id} className="bl-plan"><div className="name">{p.name}</div><div><span className="bl-pill ok">{promoLabel(p.promotion_type)}</span></div><div style={{ color: '#4b5d56', fontSize: 13.5 }}>{promoDesc(p.promotion_type)}</div>
        <div className="bl-price">{coin(p.price)}<small> / {durationLabel(p.duration_hours)}</small></div>
        <Link className="bl-btn" href="/vi-tien/mua-goi#day-tin">Chọn tin để đẩy</Link></div>)}
        {!promos.length && !loading && <p style={{ color: '#71817b' }}>Chưa có gói đẩy tin.</p>}</div>
    </div>

    <div className="bl-card bl-faq"><h2>Câu hỏi thường gặp</h2>
      <details><summary>Thanh toán như thế nào?</summary><p>Bạn nạp tiền vào ví bằng cách quét mã QR hoặc chuyển khoản theo nội dung hệ thống cung cấp. Sau khi quản trị viên xác nhận, số dư được cộng vào ví và dùng để mua gói.</p></details>
      <details><summary>Mua lại gói khi chưa hết hạn thì sao?</summary><p>Mua lại đúng gói đang dùng sẽ được cộng dồn thêm thời hạn. Đổi sang gói khác sẽ áp dụng ngay và thay thế gói cũ.</p></details>
      <details><summary>Hết hạn gói thì tin đăng có mất không?</summary><p>Tin đã đăng không bị xóa, nhưng bạn không thể đăng thêm nếu số tin vượt hạn mức miễn phí.</p></details>
    </div>

    {buying && <PayModal item={{ kind: 'PLAN', title: planLabel(buying.name), subtitle: buying.billing_cycle === 'YEARLY' ? '1 năm' : '1 tháng', price: buying.price, planId: buying.id }} balance={balance}
      onClose={() => setBuying(null)} onSuccess={() => router.push('/vi-tien/mua-goi?bought=plan')}
      onRefresh={() => { memberRequest<Overview>('/billing/overview').then(setOverview).catch(() => undefined); }} />}
  </main>;
}
