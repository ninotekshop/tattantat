'use client';
import '../../goi-dich-vu/billing.css';
import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemberArea } from '../../../components/MemberArea';
import { PayItem, PayModal } from '../../../components/PayModal';
import { PromoGuide } from '../../../components/PromoGuide';
import { CelebrationDialog, type CelebrationKind } from '../../../components/CelebrationDialog';
import { apiGet, memberRequest } from '../../../lib/api';
import { coin } from '../../../lib/coin';
import { Plan, PromoPackage, dateVi, daysLeft, durationLabel, featureList, planLabel, FREE_PLAN_LABEL, promoDesc, promoLabel } from '../../../lib/billing';

type Overview = {
  balance: string;
  subscription: { id: string; name: string; endsAt: string | null } | null;
  listing: { used: number; limit: number | null };
  history: { id: string; name: string; status: string; price: string; startsAt: string; endsAt: string | null }[];
  promotions: { id: string; name: string; status: string; price: string; productTitle: string | null; endsAt: string | null }[];
};
type MyListing = { id: string; title: string | null; status: string; productId: string | null };

export default function BuyPackagesPage() {
  return <MemberArea>{() => <Suspense fallback={null}><BuyPackages /></Suspense>}</MemberArea>;
}

function BuyPackages() {
  const params = useSearchParams();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [promos, setPromos] = useState<PromoPackage[]>([]);
  const [listings, setListings] = useState<MyListing[]>([]);
  const [productId, setProductId] = useState('');
  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [paying, setPaying] = useState<PayItem | null>(null);
  const [celebrate, setCelebrate] = useState<{ kind: CelebrationKind } | null>(params.get('bought') ? { kind: 'plan' } : null);
  const [error, setError] = useState('');

  const load = useCallback(() => { memberRequest<Overview>('/billing/overview').then(setOverview).catch(e => setError(e instanceof Error ? e.message : 'Không tải được dữ liệu.')); }, []);
  useEffect(() => {
    load();
    Promise.all([apiGet<Plan[]>('/subscriptions/plans'), apiGet<PromoPackage[]>('/promotions/packages')])
      .then(([p, k]) => { setPlans(p); setPromos(k); if (!p.some(x => x.billing_cycle === 'MONTHLY') && p.some(x => x.billing_cycle === 'YEARLY')) setCycle('YEARLY'); })
      .catch(e => setError(e instanceof Error ? e.message : 'Không tải được bảng giá.'));
    memberRequest<MyListing[]>('/listings/mine').then(list => setListings(list.filter(l => l.status === 'PUBLISHED' && l.productId))).catch(() => undefined);
  }, [load]);

  const shown = useMemo(() => plans.filter(p => p.billing_cycle === cycle), [plans, cycle]);
  const hasBoth = plans.some(p => p.billing_cycle === 'MONTHLY') && plans.some(p => p.billing_cycle === 'YEARLY');
  const sub = overview?.subscription; const left = daysLeft(sub?.endsAt);
  const used = overview?.listing.used ?? 0; const limit = overview?.listing.limit ?? null;
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const balance = Number(overview?.balance ?? 0);

  function buyPromo(p: PromoPackage) {
    if (!productId) { setError('Hãy chọn tin đăng cần đẩy trước khi mua gói.'); return; }
    setPaying({ kind: 'PROMO', title: p.name, subtitle: `${promoLabel(p.promotion_type)} · ${durationLabel(p.duration_hours)}`, price: p.price, packageId: p.id, productId });
  }

  return <div className="bl">
    <h1>Mua gói</h1>
    <p className="sub">Mua gói đăng tin và gói đẩy tin. Khi thanh toán, bạn chọn dùng số dư ví TTTCoin hoặc quét mã QR trực tiếp. Muốn nạp thêm TTTCoin? Vào mục <Link href="/vi-tien" style={{ color: '#007c4b', fontWeight: 700 }}>Ví TTTCoin</Link>.</p>
    {celebrate && <CelebrationDialog kind={celebrate.kind} onClose={() => setCelebrate(null)} />}
    {error && <div className="bl-msg err" role="alert">{error}</div>}

    <div className="bl-card"><h2>Gói đăng tin hiện tại</h2>
      {sub ? <>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{planLabel(sub.name)}</div>
        <div style={{ color: '#71817b' }}>Hiệu lực đến <b>{dateVi(sub.endsAt)}</b>{left !== null && <> · còn <b style={{ color: left <= 7 ? '#b53434' : '#007c4b' }}>{left} ngày</b></>}</div>
      </> : <div style={{ fontSize: 18, fontWeight: 800 }}>{FREE_PLAN_LABEL}</div>}
      <div style={{ marginTop: 12, fontSize: 13 }}>Tin đang có: <b>{used}</b> / {limit === null ? 'không giới hạn' : limit} · Số dư ví: <b>{coin(overview?.balance)}</b></div>
      {limit !== null && <div className="bl-bar"><i className={pct >= 100 ? 'full' : pct >= 80 ? 'warn' : ''} style={{ width: pct + '%' }} /></div>}
    </div>

    <div className="bl-card" id="goi-dang-tin"><h2>Gói đăng tin</h2>
      <p className="sub" style={{ marginTop: -6 }}>Đăng được nhiều tin hơn cùng lúc. Mua lại đúng gói đang dùng sẽ được cộng dồn thời hạn; đổi sang gói khác sẽ áp dụng ngay.</p>
      {hasBoth && <div className="bl-toggle" role="tablist"><button className={cycle === 'MONTHLY' ? 'on' : ''} onClick={() => setCycle('MONTHLY')}>Theo tháng</button><button className={cycle === 'YEARLY' ? 'on' : ''} onClick={() => setCycle('YEARLY')}>Theo năm</button></div>}
      <div className="bl-grid plans">{shown.map(plan => <div key={plan.id} className="bl-plan">
        <div className="name">{planLabel(plan.name)}</div>
        <div className="bl-price">{coin(plan.price)}<small> / {plan.billing_cycle === 'YEARLY' ? 'năm' : 'tháng'}</small></div>
        <ul><li>{plan.max_listings === null ? 'Đăng tin không giới hạn' : `Đăng tối đa ${plan.max_listings} tin cùng lúc`}</li>{featureList(plan.features).map(f => <li key={f}>{f}</li>)}</ul>
        <button className="bl-btn primary" onClick={() => setPaying({ kind: 'PLAN', title: planLabel(plan.name), subtitle: plan.billing_cycle === 'YEARLY' ? '1 năm' : '1 tháng', price: plan.price, planId: plan.id })}>Mua gói</button>
      </div>)}{!shown.length && <p style={{ color: '#71817b' }}>Chưa có gói đăng tin nào được mở bán.</p>}</div>
    </div>

    <div className="bl-card" id="day-tin"><h2>Đẩy tin & tin nổi bật (VIP)</h2>
      {!listings.length ? <p style={{ color: '#71817b' }}>Bạn chưa có tin đang hiển thị. <Link href="/sell" style={{ color: '#007c4b', fontWeight: 700 }}>Đăng tin ngay</Link></p> : <>
        <PromoGuide />
        <div className="bl-f" style={{ marginBottom: 14 }}><label htmlFor="promo-listing" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Chọn tin cần đẩy</label>
          <select id="promo-listing" className="bl-in" style={{ maxWidth: 480 }} value={productId} onChange={e => setProductId(e.target.value)}><option value="">— Chọn tin đăng —</option>{listings.map(l => <option key={l.id} value={l.productId ?? ''}>{l.title || '(Chưa đặt tiêu đề)'}</option>)}</select></div>
        <div className="bl-grid plans">{promos.map(p => <div key={p.id} className="bl-plan"><div className="name">{p.name}</div><div><span className="bl-pill ok">{promoLabel(p.promotion_type)}</span></div><div style={{ color: '#4b5d56', fontSize: 13.5 }}>{promoDesc(p.promotion_type)}</div>
          <div className="bl-price" style={{ fontSize: 24 }}>{coin(p.price)}<small> / {durationLabel(p.duration_hours)}</small></div>
          <button className="bl-btn primary" disabled={!productId} onClick={() => buyPromo(p)}>Mua gói này</button></div>)}</div></>}
      {!!overview?.promotions.length && <table className="bl-tbl" style={{ marginTop: 16 }}><thead><tr><th>Gói</th><th>Tin đăng</th><th>Giá</th><th>Hết hạn</th></tr></thead><tbody>
        {overview.promotions.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.productTitle ?? '—'}</td><td>{coin(p.price)}</td><td>{p.status === 'PAID' ? dateVi(p.endsAt) : p.status}</td></tr>)}</tbody></table>}
    </div>

    {!!overview?.history.length && <div className="bl-card"><h2>Lịch sử mua gói đăng tin</h2><table className="bl-tbl"><thead><tr><th>Gói</th><th>Giá</th><th>Bắt đầu</th><th>Hết hạn</th></tr></thead><tbody>
      {overview.history.map(h => <tr key={h.id}><td>{h.name}</td><td>{coin(h.price)}</td><td>{dateVi(h.startsAt)}</td><td>{dateVi(h.endsAt)}</td></tr>)}</tbody></table></div>}

    {paying && <PayModal item={paying} balance={balance} onRefresh={load} onClose={() => setPaying(null)}
      onSuccess={kind => { setPaying(null); setCelebrate({ kind: kind === 'PLAN' ? 'plan' : 'promo' }); load(); }} />}
  </div>;
}
