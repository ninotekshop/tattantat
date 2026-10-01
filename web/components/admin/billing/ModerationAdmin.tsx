'use client';
import { Ic } from '../../Ic';
import { BadgeCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import '../../../app/goi-dich-vu/billing.css';

type Settings = { mode: 'AUTO' | 'MANUAL' | 'HYBRID'; blockContactInfo: boolean; blockProhibited: boolean; prohibitedKeywords: string[]; reviewKeywords: string[]; newSellerReview: boolean; trustedMinApproved: number; trustedIfVerified: boolean; manualCategoryIds: string[]; priceReviewThreshold: number | null; reviewEdits: boolean; aiReview?: boolean; backlogReminder: boolean; backlogHours: number; backlogRepeatHours: number };
type Item = { id: string; title: string; price: string; description: string | null; createdAt: string; updatedAt: string; categoryName: string; sellerName: string; sellerEmail: string | null; sellerVerified: boolean; imageUrl: string | null; reasons: string[] | null };
type Stats = { pending: number; approvedToday: number; rejectedToday: number; autoToday: number; oldest: string | null };
type Hist = { id: string; productId: string; title: string | null; source: string; decision: string; mode: string | null; reasons: string[]; createdAt: string; actorName: string };
type Cat = { id: string; parentId: string | null; name: string; status: string };

const vnd = (v?: string | number | null) => (Number(v ?? 0) || 0).toLocaleString('vi-VN') + '\u00a0đ';
const dt = (v?: string | null) => (v ? new Date(v).toLocaleString('vi-VN') : '—');
const MODES: { key: Settings['mode']; title: string; desc: string }[] = [
  { key: 'AUTO', title: 'Kiểm duyệt tự động', desc: 'Tin đạt kiểm tra nội dung được hiển thị ngay. Chỉ chặn tin có từ khóa cấm hoặc thông tin liên hệ ngoài nền tảng.' },
  { key: 'MANUAL', title: 'Kiểm duyệt thủ công', desc: 'Mọi tin đăng đều vào hàng chờ và chỉ hiển thị sau khi quản trị viên bấm Duyệt.' },
  { key: 'HYBRID', title: 'Tự động có điều kiện (khuyên dùng)', desc: 'Tin của người bán uy tín được duyệt ngay; tin vi phạm điều kiện bên dưới (người bán mới, từ khóa, giá cao, danh mục nhạy cảm) vào hàng chờ.' },
];
const MODE_LABEL: Record<string, string> = { AUTO: 'Tự động', MANUAL: 'Thủ công', HYBRID: 'Có điều kiện' };

export function ModerationAdmin({ authHeaders }: { authHeaders: () => Record<string, string> }) {
  const [tab, setTab] = useState<'queue' | 'settings' | 'history'>('queue');
  const [error, setError] = useState(''); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  const call = useCallback(async <T,>(path: string, method = 'GET', body?: unknown): Promise<T> => {
    const res = await fetch('/api/v1' + path, { method, headers: authHeaders(), body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) throw new Error(Array.isArray(json?.message) ? json.message.join('. ') : json?.message || 'Thao tác không thành công.');
    if (json.message && method !== 'GET') setOk(json.message);
    return json.data as T;
  }, [authHeaders]);
  const run = async (fn: () => Promise<unknown>) => { setBusy(true); setError(''); setOk(''); try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); } finally { setBusy(false); } };

  // settings
  const [settings, setSettings] = useState<Settings | null>(null);
  const [cats, setCats] = useState<Cat[]>([]); const [catSearch, setCatSearch] = useState('');
  const loadSettings = useCallback(() => run(async () => { setSettings(await call<Settings>('/admin/moderation/settings')); setCats(await call<Cat[]>('/admin/listing-engine/categories')); }), [call]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'settings' && !settings) void loadSettings(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps
  const kw = (v: string) => v.split('\n').map(x => x.trim()).filter(Boolean);
  const set = (patch: Partial<Settings>) => setSettings(s => (s ? { ...s, ...patch } : s));
  const catRows = useMemo(() => {
    const q = catSearch.trim().toLowerCase(); const out: { c: Cat; depth: number }[] = [];
    const walk = (parent: string | null, depth: number) => { for (const c of cats.filter(x => x.parentId === parent)) { out.push({ c, depth }); walk(c.id, depth + 1); } };
    walk(null, 0);
    return q ? out.filter(r => r.c.name.toLowerCase().includes(q)) : out;
  }, [cats, catSearch]);

  // queue
  const [overdueH, setOverdueH] = useState(4); const [items, setItems] = useState<Item[]>([]); const [stats, setStats] = useState<Stats | null>(null); const [sel, setSel] = useState<Set<string>>(new Set()); const [open, setOpen] = useState('');
  const loadQueue = useCallback(() => run(async () => { const r = await call<{ items: Item[]; stats: Stats }>('/admin/moderation/queue'); setItems(r.items); setStats(r.stats); setSel(new Set()); try { const st = await call<Settings>('/admin/moderation/settings'); setOverdueH(st.backlogHours || 4); } catch { /* giữ mặc định */ } }), [call]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === 'queue') void loadQueue(); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps
  const act = (ids: string[], action: 'approve' | 'reject') => {
    let reason = '';
    if (action === 'reject') { reason = window.prompt(`Lý do từ chối ${ids.length} tin (người bán sẽ thấy):`) ?? ''; if (reason.trim().length < 3) return; }
    else if (ids.length > 1 && !window.confirm(`Duyệt ${ids.length} tin đã chọn?`)) return;
    void run(async () => { await call('/admin/moderation/bulk', 'POST', { ids, action, reason }); await loadQueue(); });
  };
  const toggle = (id: string) => setSel(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  // history
  const [hist, setHist] = useState<Hist[]>([]);
  useEffect(() => { if (tab === 'history') void run(async () => { setHist(await call<Hist[]>('/admin/moderation/history')); }); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const modeNow = settings?.mode;
  return <div className="bl" style={{ padding: 0 }}>
    {error && <div className="bl-msg err" role="alert">{error}</div>}{ok && <div className="bl-msg ok" role="status">{ok}</div>}
    <div className="bl-toggle" role="tablist">{([['queue', `Hàng chờ duyệt${stats?.pending ? ` (${stats.pending})` : ''}`], ['settings', 'Cài đặt kiểm duyệt'], ['history', 'Nhật ký']] as const).map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>

    {tab === 'queue' && <div>
      {stats && <div className="bl-grid plans" style={{ marginBottom: 14 }}>{[['Đang chờ duyệt', String(stats.pending)], ['Chờ lâu nhất', stats.oldest ? dt(stats.oldest) : '—'], ['Đã duyệt hôm nay (thủ công)', String(stats.approvedToday)], ['Từ chối hôm nay', String(stats.rejectedToday)], ['Tự động duyệt hôm nay', String(stats.autoToday)]].map(([l, v]) =>
        <div key={l} className="bl-card" style={{ margin: 0, padding: 14 }}><div style={{ color: '#71817b', fontSize: 12 }}>{l}</div><div style={{ fontSize: 20, fontWeight: 800, color: '#007c4b' }}>{v}</div></div>)}</div>}
      <div className="bl-card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
          <button className="bl-btn sm primary" disabled={busy || !sel.size} onClick={() => act([...sel], 'approve')}>Duyệt {sel.size || ''} tin đã chọn</button>
          <button className="bl-btn sm" disabled={busy || !sel.size} onClick={() => act([...sel], 'reject')}>Từ chối tin đã chọn</button>
          <button className="bl-btn sm" disabled={busy} onClick={() => void loadQueue()}>Tải lại</button>
          <label className="bl-chk" style={{ marginLeft: 'auto', fontSize: 13 }}><input type="checkbox" checked={!!items.length && sel.size === items.length} onChange={e => setSel(e.target.checked ? new Set(items.map(i => i.id)) : new Set())} /> Chọn tất cả</label>
        </div>
        {items.map(it => <div key={it.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid #eef3ef', alignItems: 'flex-start' }}>
          <input type="checkbox" checked={sel.has(it.id)} onChange={() => toggle(it.id)} style={{ marginTop: 6 }} aria-label={`Chọn ${it.title}`} />
          {it.imageUrl ? <img src={it.imageUrl} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} /> : <div style={{ width: 72, height: 72, background: '#eef3f0', borderRadius: 10, flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800 }}>{it.title}</div>
            <div style={{ color: '#71817b', fontSize: 12.5 }}>{vnd(it.price)} · {it.categoryName} · {it.sellerName}{it.sellerVerified && <Ic i={BadgeCheck} after/>} · gửi {dt(it.updatedAt)}{Date.now() - new Date(it.updatedAt).getTime() > overdueH * 3600_000 && <span style={{ marginLeft: 8, background: '#fde8e4', color: '#b0402b', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Tồn đọng &gt; {overdueH}h</span>}</div>
            <div style={{ marginTop: 4 }}>{(it.reasons ?? []).map(r => <span key={r} className="bl-pill wait" style={{ marginRight: 6 }}>{r}</span>)}</div>
            {open === it.id && <p style={{ whiteSpace: 'pre-wrap', color: '#334155', background: '#f7faf8', padding: 10, borderRadius: 8, margin: '8px 0 0' }}>{it.description || '(Không có mô tả)'}</p>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="bl-btn sm" onClick={() => setOpen(open === it.id ? '' : it.id)}>{open === it.id ? 'Thu gọn' : 'Xem nội dung'}</button>
            <a className="bl-btn sm" href={`/products/${it.id}`} target="_blank" rel="noreferrer">Xem trang tin</a>
            <button className="bl-btn sm primary" disabled={busy} onClick={() => act([it.id], 'approve')}>Duyệt</button>
            <button className="bl-btn sm" disabled={busy} onClick={() => act([it.id], 'reject')}>Từ chối</button>
          </div>
        </div>)}
        {!items.length && <p style={{ color: '#71817b', margin: 0 }}>{busy ? 'Đang tải…' : 'Không có tin nào đang chờ duyệt.'}</p>}
      </div>
    </div>}

    {tab === 'settings' && settings && <div style={{ maxWidth: 820 }}>
      <div className="bl-card"><h2>Chế độ kiểm duyệt</h2>
        {MODES.map(m => <label key={m.key} style={{ display: 'flex', gap: 10, padding: 12, border: '1px solid ' + (modeNow === m.key ? '#0a9a61' : '#e0e9e4'), background: modeNow === m.key ? '#f0fbf5' : '#fff', borderRadius: 12, marginBottom: 10, cursor: 'pointer' }}>
          <input type="radio" name="mode" checked={modeNow === m.key} onChange={() => set({ mode: m.key })} style={{ marginTop: 4 }} />
          <span><b>{m.title}</b><br /><span style={{ color: '#5d7a69', fontSize: 13 }}>{m.desc}</span></span></label>)}
      </div>

      <div className="bl-card"><h2>Chặn tự động (áp dụng ở mọi chế độ)</h2>
        <label className="bl-chk" style={{ display: 'flex', gap: 8, marginBottom: 8 }}><input type="checkbox" checked={settings.blockContactInfo} onChange={e => set({ blockContactInfo: e.target.checked })} /> Chặn tin chứa SĐT, Zalo, email, link ngoài nền tảng (buộc người đăng sửa)</label>
        <label className="bl-chk" style={{ display: 'flex', gap: 8, marginBottom: 12 }}><input type="checkbox" checked={settings.blockProhibited} onChange={e => set({ blockProhibited: e.target.checked })} /> Chặn tin chứa từ khóa cấm (hàng giả, ma túy, vũ khí…)</label>
        <label style={{ fontWeight: 700 }}>Từ khóa cấm bổ sung (mỗi dòng một từ)</label>
        <textarea className="bl-in" rows={3} style={{ maxWidth: '100%', margin: '6px 0' }} defaultValue={settings.prohibitedKeywords.join('\n')} onBlur={e => set({ prohibitedKeywords: kw(e.target.value) })} />
        <small style={{ color: '#7a8b82' }}>Nếu tắt các mục chặn, tin vi phạm sẽ được chuyển vào hàng chờ để duyệt tay thay vì bị từ chối ngay.</small>
      </div>

      <div className="bl-card" style={{ opacity: modeNow === 'HYBRID' ? 1 : .55 }}><h2>Điều kiện đưa vào hàng chờ (chế độ có điều kiện)</h2>
        {modeNow !== 'HYBRID' && <div className="bl-msg info">Chỉ có tác dụng khi chọn “Tự động có điều kiện”.</div>}
        <label className="bl-chk" style={{ display: 'flex', gap: 8, marginBottom: 6 }}><input type="checkbox" checked={settings.newSellerReview} onChange={e => set({ newSellerReview: e.target.checked })} /> Người bán mới phải được duyệt</label>
        <div style={{ marginLeft: 26, marginBottom: 12, fontSize: 13 }}>Người bán được tin tưởng khi đã có ít nhất <input className="bl-in" type="number" min={0} max={1000} style={{ width: 80, display: 'inline-block', margin: '0 6px' }} value={settings.trustedMinApproved} onChange={e => set({ trustedMinApproved: Number(e.target.value) })} /> tin đang hiển thị/đã bán,
          <label className="bl-chk" style={{ display: 'flex', gap: 8, marginTop: 6 }}><input type="checkbox" checked={settings.trustedIfVerified} onChange={e => set({ trustedIfVerified: e.target.checked })} /> hoặc tài khoản đã được xác minh</label></div>
        <label style={{ fontWeight: 700 }}>Từ khóa cần kiểm tra (mỗi dòng một từ)</label>
        <textarea className="bl-in" rows={3} style={{ maxWidth: '100%', margin: '6px 0 12px' }} defaultValue={settings.reviewKeywords.join('\n')} onBlur={e => set({ reviewKeywords: kw(e.target.value) })} />
        <label style={{ fontWeight: 700 }}>Tin có giá từ (VNĐ) trở lên phải duyệt tay (để trống = không áp dụng)</label>
        <input className="bl-in" type="number" min={0} style={{ maxWidth: 260, margin: '6px 0 12px', display: 'block' }} value={settings.priceReviewThreshold ?? ''} onChange={e => set({ priceReviewThreshold: e.target.value === '' ? null : Number(e.target.value) })} />
        <label style={{ fontWeight: 700 }}>Danh mục luôn duyệt thủ công ({settings.manualCategoryIds.length} đã chọn)</label>
        <input className="bl-in" placeholder="Tìm danh mục…" style={{ maxWidth: 300, margin: '6px 0' }} value={catSearch} onChange={e => setCatSearch(e.target.value)} />
        <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #e0e9e4', borderRadius: 10, padding: 8 }}>{catRows.map(({ c, depth }) => <label key={c.id} className="bl-chk" style={{ display: 'flex', gap: 8, padding: '3px 0', paddingLeft: depth * 18 }}>
          <input type="checkbox" checked={settings.manualCategoryIds.includes(c.id)} onChange={e => set({ manualCategoryIds: e.target.checked ? [...settings.manualCategoryIds, c.id] : settings.manualCategoryIds.filter(x => x !== c.id) })} />{c.name}</label>)}</div>
        <small style={{ color: '#7a8b82' }}>Chọn danh mục cha sẽ áp dụng cho toàn bộ danh mục con.</small>
      </div>

      <div className="bl-card"><h2>Nhắc khi tin chờ duyệt tồn đọng</h2>
        <label className="bl-chk" style={{ display: 'flex', gap: 8, marginBottom: 10 }}><input type="checkbox" checked={settings.backlogReminder} onChange={e => set({ backlogReminder: e.target.checked })} /> Tự động gửi thông báo cho quản trị viên khi có tin chờ duyệt quá lâu</label>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
          <label style={{ fontSize: 13 }}>Coi là tồn đọng sau (giờ)<br /><input type="number" min={1} max={168} value={settings.backlogHours} onChange={e => set({ backlogHours: Number(e.target.value) })} style={{ width: 110 }} /></label>
          <label style={{ fontSize: 13 }}>Nhắc lại sau mỗi (giờ)<br /><input type="number" min={1} max={72} value={settings.backlogRepeatHours} onChange={e => set({ backlogRepeatHours: Number(e.target.value) })} style={{ width: 110 }} /></label>
        </div>
        <button className="bl-btn sm" disabled={busy} onClick={() => void run(async () => { await call('/admin/moderation/remind-now', 'POST', {}); })}>Gửi nhắc ngay</button>
      </div>
      <div className="bl-card"><h2>Chỉnh sửa tin đã đăng</h2>
        <label className="bl-chk" style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={settings.aiReview !== false} onChange={e => set({ aiReview: e.target.checked })} /> AI rà soát tin: tin nghi ngờ (lừa đảo, hàng cấm, spam…) tự động chuyển vào hàng chờ duyệt kèm lý do. AI không tự từ chối tin.</label>
        <label className="bl-chk" style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={settings.reviewEdits} onChange={e => set({ reviewEdits: e.target.checked })} /> Tin đã đăng bị sửa nội dung thì kiểm tra lại theo các quy tắc trên</label></div>
      <button className="bl-btn primary" disabled={busy} onClick={() => void run(async () => { setSettings(await call<Settings>('/admin/moderation/settings', 'PUT', { settings })); })}>Lưu cài đặt kiểm duyệt</button>
    </div>}
    {tab === 'settings' && !settings && <p>Đang tải cài đặt…</p>}

    {tab === 'history' && <div className="bl-card"><table className="bl-tbl"><thead><tr><th>Thời gian</th><th>Tin đăng</th><th>Kết quả</th><th>Nguồn</th><th>Lý do</th></tr></thead><tbody>
      {hist.map(h => <tr key={h.id}><td>{dt(h.createdAt)}</td><td>{h.title ?? h.productId}</td>
        <td><span className={`bl-pill ${h.decision === 'APPROVED' ? 'ok' : h.decision === 'REJECTED' ? 'bad' : 'wait'}`}>{h.decision === 'APPROVED' ? 'Được duyệt' : h.decision === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}</span></td>
        <td>{h.source === 'ADMIN' ? `Admin ${h.actorName}` : `Tự động (${MODE_LABEL[h.mode ?? ''] ?? '—'})`}</td><td>{(h.reasons ?? []).join('; ')}</td></tr>)}
      {!hist.length && <tr><td colSpan={5} style={{ color: '#71817b' }}>Chưa có nhật ký.</td></tr>}</tbody></table></div>}
  </div>;
}
