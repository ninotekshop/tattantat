'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { monthlyPayment, rollingCost, vnd, vndShort } from '../../lib/verticals';

type Specs = { specs: { key: string; label: string; value: string }[]; vertical: 'PROPERTY' | 'VEHICLE' | null; priceMode: string; price: number | null; area: number | null; dealType: string | null };
type Market = { available: boolean; reason?: string; unit?: 'VND' | 'VND_PER_M2'; scope?: string; region?: string | null; sampleSize?: number; mine?: number; median?: number; min?: number; max?: number; cheaperThanPercent?: number; diffPercentVsMedian?: number | null };
const box: React.CSSProperties = { border: '1px solid #e3ebe6', borderRadius: 12, padding: 14, marginTop: 12, background: '#fff' };
const inp: React.CSSProperties = { padding: '7px 9px', border: '1px solid #dbe4dd', borderRadius: 8, width: 110 };

function Num({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) {
  return <label style={{ display: 'grid', gap: 3, fontSize: 12.5, color: '#475569' }}>{label}<span><input style={inp} inputMode="decimal" value={value} onChange={e => { const n = Number(e.target.value.replace(/[^\d.]/g, '')); onChange(Number.isFinite(n) ? n : 0); }} /> {suffix}</span></label>;
}

function Loan({ price, defaultDown }: { price: number; defaultDown: number }) {
  const [down, setDown] = useState(defaultDown); const [rate, setRate] = useState(9); const [years, setYears] = useState(defaultDown >= 30 ? 15 : 5);
  const principal = Math.max(0, price * (1 - down / 100)); const r = monthlyPayment(principal, rate, years);
  return <div style={box}><b>Tính khoản vay ước tính</b>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '8px 0' }}><Num label="Trả trước" value={down} onChange={n => setDown(Math.min(100, n))} suffix="%" /><Num label="Lãi suất" value={rate} onChange={setRate} suffix="%/năm" /><Num label="Thời hạn" value={years} onChange={n => setYears(Math.min(35, n))} suffix="năm" /></div>
    <div style={{ fontSize: 14 }}>Vay <b>{vndShort(principal)}</b> → trả khoảng <b style={{ color: '#00a65a' }}>{vnd(r.monthly)}</b>/tháng · tổng lãi {vndShort(r.totalInterest)}</div>
    <small style={{ color: '#71817b' }}>Chỉ mang tính tham khảo (trả đều hàng tháng, lãi suất cố định). Vui lòng hỏi ngân hàng để có số liệu chính xác.</small></div>;
}

function RollingCost({ price }: { price: number }) {
  const [pct, setPct] = useState(10); const [plate, setPlate] = useState(1_000_000); const [other, setOther] = useState(2_000_000);
  const c = rollingCost(price, { registrationPct: pct, plateFee: plate, otherFees: other });
  return <div style={box}><b>Chi phí lăn bánh ước tính</b>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '8px 0' }}><Num label="Lệ phí trước bạ" value={pct} onChange={setPct} suffix="%" /><Num label="Phí biển số" value={plate} onChange={setPlate} suffix="đ" /><Num label="Đăng kiểm, bảo hiểm, khác" value={other} onChange={setOther} suffix="đ" /></div>
    <div style={{ fontSize: 14 }}>Trước bạ {vnd(c.registration)} · Tổng chi phí ≈ <b style={{ color: '#00a65a' }}>{vnd(c.total)}</b></div>
    <small style={{ color: '#71817b' }}>Mức trước bạ và phí biển số khác nhau theo tỉnh/thành và loại xe; hãy chỉnh theo quy định tại nơi bạn đăng ký. Chỉ mang tính tham khảo.</small></div>;
}

function MarketBox({ m }: { m: Market }) {
  if (!m.available) return null;
  const unit = m.unit === 'VND_PER_M2' ? '/m²' : ''; const d = m.diffPercentVsMedian;
  return <div style={box}><b>So sánh giá với tin tương tự</b>
    <div style={{ fontSize: 14, margin: '6px 0' }}>Giá của tin này: <b>{vndShort(m.mine!)}{unit}</b> · Trung vị {m.scope}: <b>{vndShort(m.median!)}{unit}</b> ({m.sampleSize} tin)</div>
    {d !== null && d !== undefined && <div style={{ fontSize: 14, color: d <= -5 ? '#00875a' : d >= 5 ? '#b45309' : '#475569' }}>{d <= -5 ? `Thấp hơn mặt bằng chung ${Math.abs(d)}%` : d >= 5 ? `Cao hơn mặt bằng chung ${d}%` : 'Sát mặt bằng chung'} · rẻ hơn {m.cheaperThanPercent}% tin cùng loại</div>}
    <small style={{ color: '#71817b' }}>Khoảng giá {vndShort(m.min!)}{unit} – {vndShort(m.max!)}{unit}{m.region ? ` tại ${m.region}` : ''}. Giá rao chưa phản ánh giá chốt thực tế.</small></div>;
}

export function ProductTools({ productId }: { productId: string }) {
  const [s, setS] = useState<Specs | null>(null); const [m, setM] = useState<Market | null>(null);
  useEffect(() => { let on = true; apiGet<Specs>(`/search/specs/${encodeURIComponent(productId)}`).then(v => { if (on) setS(v); }).catch(() => undefined); apiGet<Market>(`/search/market/${encodeURIComponent(productId)}`).then(v => { if (on) setM(v); }).catch(() => undefined); return () => { on = false; }; }, [productId]);
  if (!s) return null;
  const sale = s.price !== null && s.priceMode === 'FIXED' && (s.vertical === 'VEHICLE' || (s.vertical === 'PROPERTY' && s.dealType !== 'Cho thuê' && s.price >= 50_000_000));
  return <>
    {s.specs.length > 0 && <div className="product-specs-table" style={{ marginBottom: 8 }}>{s.specs.map(r => <div className="spec-row" key={r.key}><span className="spec-label">{r.label}:</span><span className="spec-val">{r.value}</span></div>)}</div>}
    {s.vertical === 'PROPERTY' && s.area && s.price && s.priceMode === 'FIXED' && s.dealType !== 'Cho thuê' && <div style={{ fontSize: 14, margin: '8px 0' }}>Đơn giá ≈ <b>{vndShort(s.price / s.area)}/m²</b></div>}
    {m && <MarketBox m={m} />}
    {sale && s.vertical === 'VEHICLE' && <RollingCost price={s.price!} />}
    {sale && <Loan price={s.price!} defaultDown={s.vertical === 'PROPERTY' ? 30 : 20} />}
  </>;
}
