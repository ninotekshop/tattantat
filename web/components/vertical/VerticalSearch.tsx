'use client';
import { Ic } from '../Ic';
import { Bell, BadgeCheck } from 'lucide-react';
import { VideoBadge } from '../VideoBadge';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, memberRequest, type Product } from '../../lib/api';
import { readSession } from '../../lib/auth';
import { vndShort, PROPERTY_VERTICAL, VEHICLE_VERTICAL, type FilterDef } from '../../lib/verticals';
import './vertical.css';

type Item = Product & { attrs?: Record<string, unknown>; sellerVerified?: boolean };
type Vals = Record<string, { min?: string; max?: string; eq?: string }>;

/** `kind` là chuỗi (Server Component không truyền được hàm `filters` sang Client Component). */
export function VerticalSearch({ kind }: { kind: 'property' | 'vehicle' }) {
  const vertical = kind === 'vehicle' ? VEHICLE_VERTICAL : PROPERTY_VERTICAL;
  const [tab, setTab] = useState(vertical.tabs[0].slug);
  const [q, setQ] = useState(''); const [minPrice, setMinPrice] = useState(''); const [maxPrice, setMaxPrice] = useState(''); const [location, setLocation] = useState('');
  const [sort, setSort] = useState('new'); const [vals, setVals] = useState<Vals>({});
  const [items, setItems] = useState<Item[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true); const [msg, setMsg] = useState('');
  const filters = vertical.filters(tab);

  const params = useCallback((pg: number) => {
    const attrs: Record<string, { min?: number; max?: number; eq?: string[] }> = {};
    for (const f of filters) { const v = vals[f.key]; if (!v) continue; const one: { min?: number; max?: number; eq?: string[] } = {}; if (v.min) one.min = Number(v.min); if (v.max) one.max = Number(v.max); if (v.eq) one.eq = [v.eq]; if (Object.keys(one).length) attrs[f.key] = one; }
    return { categorySlug: tab, q, minPrice: minPrice.replace(/\D/g, ''), maxPrice: maxPrice.replace(/\D/g, ''), location, sort, attrs: Object.keys(attrs).length ? JSON.stringify(attrs) : undefined, page: pg, limit: 24 };
  }, [tab, q, minPrice, maxPrice, location, sort, vals]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { let on = true; setLoading(true); setPage(1); api.search(params(1)).then(r => { if (on) { setItems(r.items as Item[]); setTotal(r.total); } }).catch(() => { if (on) { setItems([]); setTotal(0); } }).finally(() => { if (on) setLoading(false); }); return () => { on = false; }; }, [params]);
  async function more() { const r = await api.search(params(page + 1)); setItems(p => [...p, ...(r.items as Item[]).filter(i => !p.some(x => x.id === i.id))]); setPage(page + 1); setTotal(r.total); }
  async function save() {
    setMsg(''); if (!readSession()) { setMsg('Hãy đăng nhập để lưu tìm kiếm.'); return; }
    try { const { page: _p, limit: _l, sort: _s, ...rest } = params(1); void _p; void _l; void _s; await memberRequest('/me/saved-searches', 'POST', { name: `${vertical.title} — ${vertical.tabs.find(t => t.slug === tab)?.name}`, params: rest }); setMsg('Đã lưu — bạn sẽ được báo khi có tin mới phù hợp.'); }
    catch (e) { setMsg(e instanceof Error ? e.message : 'Không lưu được.'); }
  }
  const set = (key: string, patch: { min?: string; max?: string; eq?: string }) => setVals(v => ({ ...v, [key]: { ...v[key], ...patch } }));
  const hl = vertical.highlight(tab);
  const control = (f: FilterDef) => {
    const v = vals[f.key] ?? {}; const st = { padding: '8px 10px', border: '1px solid #dbe4dd', borderRadius: 8, width: 100 };
    if (f.kind === 'range') return <span key={f.key} className="vt-f">{f.label}<span><input style={st} inputMode="numeric" placeholder={f.placeholder?.[0] ?? 'Từ'} value={v.min ?? ''} onChange={e => set(f.key, { min: e.target.value.replace(/\D/g, '') })} /> – <input style={st} inputMode="numeric" placeholder={f.placeholder?.[1] ?? 'Đến'} value={v.max ?? ''} onChange={e => set(f.key, { max: e.target.value.replace(/\D/g, '') })} /> {f.unit}</span></span>;
    if (f.kind === 'max') return <span key={f.key} className="vt-f">{f.label}<input style={st} inputMode="numeric" placeholder={f.placeholder} value={v.max ?? ''} onChange={e => set(f.key, { max: e.target.value.replace(/\D/g, '') })} /></span>;
    if (f.kind === 'min') return <span key={f.key} className="vt-f">{f.label}<select style={st} value={v.min ?? ''} onChange={e => set(f.key, { min: e.target.value })}><option value="">Tất cả</option>{f.options.map(o => <option key={o} value={o}>{o}{f.suffix}</option>)}</select></span>;
    return <span key={f.key} className="vt-f">{f.label}<select style={{ ...st, width: 150 }} value={v.eq ?? ''} onChange={e => set(f.key, { eq: e.target.value })}><option value="">Tất cả</option>{f.options.map(o => <option key={o} value={o}>{o}</option>)}</select></span>;
  };

  return <main className="vt">
    <h1>{vertical.title}</h1><p className="vt-sub">{vertical.subtitle}</p>
    <div className="vt-tabs">{vertical.tabs.map(t => <button key={t.slug} className={t.slug === tab ? 'on' : ''} onClick={() => { setTab(t.slug); setVals({}); }}>{t.name}</button>)}</div>
    <div className="vt-bar">
      <input placeholder="Từ khóa (tên dự án, đường, dòng xe…)" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 200, padding: '9px 12px', border: '1px solid #dbe4dd', borderRadius: 8 }} />
      <input placeholder="Khu vực (VD: Quy Nhơn)" value={location} onChange={e => setLocation(e.target.value)} style={{ width: 170, padding: '9px 12px', border: '1px solid #dbe4dd', borderRadius: 8 }} />
    </div>
    <div className="vt-bar">
      <span className="vt-f">Giá<span><input style={{ padding: '8px 10px', border: '1px solid #dbe4dd', borderRadius: 8, width: 130 }} inputMode="numeric" placeholder="Từ (đ)" value={minPrice} onChange={e => setMinPrice(e.target.value)} /> – <input style={{ padding: '8px 10px', border: '1px solid #dbe4dd', borderRadius: 8, width: 130 }} inputMode="numeric" placeholder="Đến (đ)" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} /></span></span>
      {filters.map(control)}
      <span className="vt-f">Sắp xếp<select style={{ padding: '8px 10px', border: '1px solid #dbe4dd', borderRadius: 8 }} value={sort} onChange={e => setSort(e.target.value)}><option value="new">Mới nhất</option><option value="price_asc">Giá thấp → cao</option><option value="price_desc">Giá cao → thấp</option></select></span>
      <button className="vt-save" onClick={() => void save()}><Ic i={Bell} solid/>Lưu tìm kiếm</button>
    </div>
    <div className="vt-count">{loading ? 'Đang tìm…' : `${total.toLocaleString('vi-VN')} tin phù hợp`} {msg && <span role="status" style={{ color: '#0f766e', marginLeft: 8 }}>{msg}</span>}</div>
    <div className="vt-grid">{items.map(it => {
      const price = /^\d+(\.0+)?$/.test(it.price) ? Number(it.price) : null;
      const chips = hl.map(h => { const v = it.attrs?.[h.key]; return v === undefined || v === '' || v === null ? null : `${typeof v === 'number' ? v.toLocaleString('vi-VN') : String(v)}${h.unit ? ' ' + h.unit : ''}${h.key === 'bedrooms' ? ' PN' : ''}`; }).filter(Boolean) as string[];
      return <Link key={it.id} href={`/products/${it.id}`} className="vt-card">
        <div className="vt-img" style={{ backgroundImage: it.imageUrl ? `url(${it.imageUrl})` : undefined, position: 'relative' }}><VideoBadge show={(it as any).hasVideo} /></div>
        <div className="vt-body"><div className="vt-title">{it.title}</div><div className="vt-price">{price !== null ? vndShort(price) : 'Thỏa thuận'}</div>
          {!!chips.length && <div className="vt-chips">{chips.map(c => <span key={c}>{c}</span>)}</div>}
          <div className="vt-loc">{it.location}{it.sellerVerified && <> · <Ic i={BadgeCheck}/>Đã xác thực</>}</div></div>
      </Link>;
    })}</div>
    {!loading && !items.length && <p className="vt-empty">Chưa có tin phù hợp. Hãy nới bộ lọc hoặc lưu tìm kiếm để được báo khi có tin mới.</p>}
    {!loading && items.length < total && <div style={{ textAlign: 'center', margin: 20 }}><button className="vt-more" onClick={() => void more()}>Xem thêm</button></div>}
  </main>;
}
