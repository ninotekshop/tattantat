'use client';
import { useCallback, useEffect, useState } from 'react';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { memberRequest } from '../lib/api';
import { ALL_PROVINCES } from '../lib/locations';

type Addr = { id: string; label: string; province: string; district: string; ward: string; address: string; hideExact: boolean; isDefault: boolean; latitude?: number | null; longitude?: number | null };
const EMPTY = { label: '', province: '', district: '', ward: '', address: '', hideExact: true, isDefault: false };
let wardsCache: Record<string, string[]> | null = null;

/** Sổ địa chỉ trong Hồ sơ: thêm / sửa / xóa / đặt mặc định. */
export default function AddressBook() {
  const [items, setItems] = useState<Addr[] | null>(null);
  const [form, setForm] = useState<(typeof EMPTY & { id?: string }) | null>(null);
  const [wards, setWards] = useState<string[]>([]);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  const load = useCallback(() => { memberRequest<Addr[]>('/me/addresses').then(setItems).catch(e => setError(e instanceof Error ? e.message : 'Không tải được địa chỉ.')); }, []);
  useEffect(load, [load]);

  const districts = (ALL_PROVINCES.find((p: any) => p.name === form?.province)?.children as any[] | undefined) ?? [];
  const districtCode = districts.find((d: any) => d.name === form?.district)?.code as string | undefined;
  useEffect(() => {
    if (!districtCode) { setWards([]); return; }
    let off = false;
    (async () => {
      try { if (!wardsCache) wardsCache = await (await fetch('/data/vn-wards.json')).json(); if (!off) setWards(wardsCache?.[districtCode] ?? []); }
      catch { if (!off) setWards([]); }
    })();
    return () => { off = true; };
  }, [districtCode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!form || busy) return;
    if (!form.province) { setError('Hãy chọn Tỉnh / Thành phố.'); return; }
    setBusy(true); setError('');
    try {
      const { id, ...body } = form;
      setItems(await memberRequest<Addr[]>(id ? '/me/addresses/' + id : '/me/addresses', id ? 'PUT' : 'POST', body));
      setForm(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Chưa lưu được địa chỉ.'); } finally { setBusy(false); }
  }
  async function act(path: string, method: string) {
    if (busy) return; setBusy(true); setError('');
    try { setItems(await memberRequest<Addr[]>(path, method)); } catch (err) { setError(err instanceof Error ? err.message : 'Thao tác chưa thành công.'); } finally { setBusy(false); }
  }
  const set = (patch: Partial<typeof EMPTY>) => setForm(f => (f ? { ...f, ...patch } : f));
  const line = (a: Addr) => [a.address, a.ward, a.district, a.province].filter(Boolean).join(', ');

  return (
    <div>
      <div className="ac-bar"><h2>Địa chỉ của tôi <small>{items?.length ?? 0}</small></h2>
        {!form && <button className="ac-btn primary" onClick={() => setForm({ ...EMPTY })}><Plus size={16} />Thêm địa chỉ</button>}</div>
      <p className="ac-hint">Lưu nhiều địa chỉ giao dịch (nhà, cửa hàng, kho…) rồi chọn nhanh khi đăng tin.</p>
      {error && <p className="ac-hint" style={{ color: '#dc2626' }}>{error}</p>}
      {form && <form className="ac-form" onSubmit={submit} style={{ display: 'grid', gap: 10, maxWidth: 520, margin: '12px 0' }}>
        <input placeholder="Tên gợi nhớ (VD: Nhà, Cửa hàng, Kho)" maxLength={40} value={form.label} onChange={e => set({ label: e.target.value })} />
        <select value={form.province} onChange={e => set({ province: e.target.value, district: '', ward: '' })}>
          <option value="">-- Tỉnh / Thành phố --</option>{ALL_PROVINCES.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        <select value={form.district} disabled={!form.province} onChange={e => set({ district: e.target.value, ward: '' })}>
          <option value="">-- Quận / Huyện --</option>{districts.map((d: any) => <option key={d.id || d.name} value={d.name}>{d.name}</option>)}
        </select>
        {wards.length > 0 || !form.district
          ? <select value={form.ward} disabled={!form.district} onChange={e => set({ ward: e.target.value })}>
            <option value="">-- Phường / Xã --</option>{form.ward && !wards.includes(form.ward) && <option value={form.ward}>{form.ward}</option>}{wards.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          : <input placeholder="Phường / Xã" value={form.ward} onChange={e => set({ ward: e.target.value })} />}
        <input placeholder="Số nhà, tên đường (không bắt buộc)" maxLength={200} value={form.address} onChange={e => set({ address: e.target.value })} />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={form.hideExact} onChange={e => set({ hideExact: e.target.checked })} />Ẩn địa chỉ cụ thể, chỉ hiện phường/xã</label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={form.isDefault} onChange={e => set({ isDefault: e.target.checked })} />Đặt làm địa chỉ mặc định</label>
        <div className="ac-row"><button className="ac-btn primary" disabled={busy}>{form.id ? 'Lưu thay đổi' : 'Thêm địa chỉ'}</button><button type="button" className="ac-btn" onClick={() => { setForm(null); setError(''); }}>Hủy</button></div>
      </form>}
      {items && !items.length && !form && <div className="ac-empty"><MapPin size={34} /><h3>Chưa có địa chỉ nào</h3><p>Thêm địa chỉ để đăng tin nhanh hơn.</p></div>}
      <div className="ac-grid">{(items ?? []).map(a => <article className="ac-item" key={a.id}><div className="ac-item-b">
        <h3>{a.label}{a.isDefault && <span className="ac-chip ok" style={{ marginLeft: 8 }}>Mặc định</span>}</h3>
        <p className="ac-hint">{line(a)}</p>
        <div className="ac-actions">
          <button className="ac-btn sm" disabled={busy} onClick={() => setForm({ id: a.id, label: a.label, province: a.province, district: a.district, ward: a.ward, address: a.address, hideExact: a.hideExact, isDefault: a.isDefault })}><Pencil size={14} />Sửa</button>
          {!a.isDefault && <button className="ac-btn sm" disabled={busy} onClick={() => void act('/me/addresses/' + a.id + '/default', 'PATCH')}><Star size={14} />Đặt mặc định</button>}
          <button className="ac-btn sm danger" disabled={busy} onClick={() => { if (window.confirm('Xóa địa chỉ "' + a.label + '"?')) void act('/me/addresses/' + a.id, 'DELETE'); }}><Trash2 size={14} />Xóa</button>
        </div></div></article>)}</div>
    </div>
  );
}
