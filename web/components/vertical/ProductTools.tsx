'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';
import { vndShort } from '../../lib/verticals';

type Specs = { specs: { key: string; label: string; value: string }[]; vertical: 'PROPERTY' | 'VEHICLE' | null; priceMode: string; price: number | null; area: number | null; dealType: string | null };
type Market = { available: boolean; reason?: string; unit?: 'VND' | 'VND_PER_M2'; scope?: string; region?: string | null; sampleSize?: number; mine?: number; median?: number; min?: number; max?: number; cheaperThanPercent?: number; diffPercentVsMedian?: number | null };
const box: React.CSSProperties = { border: '1px solid #e3ebe6', borderRadius: 12, padding: 14, marginTop: 12, background: '#fff' };
const inp: React.CSSProperties = { padding: '7px 9px', border: '1px solid #dbe4dd', borderRadius: 8, width: 110 };

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
  return <>
    {s.specs.length > 0 && <div className="product-specs-table" style={{ marginBottom: 8 }}>{s.specs.map(r => <div className="spec-row" key={r.key}><span className="spec-label">{r.label}:</span><span className="spec-val">{r.value}</span></div>)}</div>}
    {s.vertical === 'PROPERTY' && s.area && s.price && s.priceMode === 'FIXED' && s.dealType !== 'Cho thuê' && <div style={{ fontSize: 14, margin: '8px 0' }}>Đơn giá ≈ <b>{vndShort(s.price / s.area)}/m²</b></div>}
    {m && <MarketBox m={m} />}
  </>;
}
