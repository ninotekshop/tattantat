'use client';
import { Ic } from '../../Ic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Eye, EyeOff, FolderPlus, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { DynamicField } from '../../listings/DynamicField';
import { Field, ListingError, Template, listingRequest, priceLabels, visible } from '../../../lib/listings';
import { validateTemplate } from '../../../../backend/src/listings/listing-domain';
import '../../../app/sell/listing-form.css';
import './form-builder.css';

type AdminCategory = {
  id: string; parentId: string | null; name: string; slug: string; description: string | null; iconUrl: string | null;
  sortOrder: number; status: string; isGroup: boolean; templateVersion: number | null; hasTemplate: boolean;
  editedByAdmin: boolean | null; fieldCount: number; listingCount: number;
};
type Row = Field & { uid: string; isNew?: boolean };
type Settings = { name: string; config: Template['config'] };
type VersionInfo = { version: number; name: string; active: boolean; createdAt: string; byAdmin: boolean; fieldCount: number; reason: string | null };

const TYPE_INFO: Record<string, { label: string; hint: string }> = {
  text: { label: 'Văn bản ngắn', hint: 'Tên, mã, một dòng chữ' },
  textarea: { label: 'Văn bản dài', hint: 'Mô tả, ghi chú nhiều dòng' },
  number: { label: 'Số', hint: 'Diện tích, số phòng, km...' },
  currency: { label: 'Số tiền (VNĐ)', hint: 'Giá trị tiền tệ' },
  year: { label: 'Năm', hint: 'Năm sản xuất, năm xây dựng' },
  range: { label: 'Khoảng số', hint: 'Giá trị số có giới hạn' },
  select: { label: 'Chọn 1 (danh sách xổ)', hint: 'Hãng, màu sắc, loại...' },
  radio: { label: 'Chọn 1 (nút tròn)', hint: 'Ít lựa chọn, hiện sẵn' },
  'multi-select': { label: 'Chọn nhiều', hint: 'Tiện ích, tính năng' },
  checkbox: { label: 'Hộp tích', hint: 'Đồng ý / có' },
  boolean: { label: 'Có / Không', hint: 'Bảo hành, chính chủ...' },
  date: { label: 'Ngày', hint: 'Ngày tháng cụ thể' },
  location: { label: 'Địa điểm', hint: 'Vị trí' },
  image: { label: 'Ảnh', hint: 'Chọn ảnh đã tải lên' },
  video: { label: 'Video', hint: 'Chọn video đã tải lên' },
};
const PALETTE = ['text', 'textarea', 'number', 'currency', 'year', 'select', 'radio', 'multi-select', 'boolean', 'date'];
const HAS_OPTIONS = ['select', 'radio', 'multi-select'];
const NUMERIC = ['number', 'year', 'range', 'currency'];
const TEXTUAL = ['text', 'textarea'];
const OPERATORS = [{ v: 'eq', l: 'bằng' }, { v: 'ne', l: 'khác (và đã nhập)' }, { v: 'in', l: 'là một trong' }];

const uid = () => Math.random().toString(36).slice(2, 10);
const withUid = (fields: Field[]): Row[] => fields.map(field => ({ ...field, uid: uid() }));
const stripRows = (rows: Row[]): Field[] => rows.map(({ uid: _u, isNew: _n, ...field }) => field);
export function slugify(text: string, separator = '_'): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
    .replace(/[^a-z0-9]+/g, separator).replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
}
function fieldKeyFrom(label: string, taken: Set<string>): string {
  let base = slugify(label) || 'truong';
  if (!/^[a-z]/.test(base)) base = 'f_' + base;
  base = base.slice(0, 56);
  let key = base; let i = 2;
  while (taken.has(key)) key = `${base}_${i++}`;
  return key;
}
const num = (value: string): number | undefined => (value.trim() === '' || !Number.isFinite(Number(value)) ? undefined : Number(value));
const money = (value?: number) => (typeof value === 'number' ? value.toLocaleString('vi-VN') + ' đ' : '');

export function FormBuilder() {
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState('');
  const [tab, setTab] = useState<'fields' | 'settings' | 'preview' | 'category' | 'history'>('fields');
  const [rows, setRows] = useState<Row[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [baseline, setBaseline] = useState('');
  const [inherited, setInherited] = useState(false);
  const [version, setVersion] = useState(0);
  const [openField, setOpenField] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  const cat = cats.find(item => item.id === selected);
  const snapshot = useCallback((r: Row[], s: Settings | null) => JSON.stringify({ f: stripRows(r), s }), []);
  const dirty = !!settings && snapshot(rows, settings) !== baseline;

  const loadCats = useCallback(async () => {
    try { setCats(await listingRequest<AdminCategory[]>('/admin/listing-engine/categories')); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không tải được danh mục.'); }
  }, []);
  useEffect(() => { void loadCats(); }, [loadCats]);

  const loadTemplate = useCallback(async (id: string, fallbackName: string) => {
    setLoading(true); setError(''); setOpenField('');
    try {
      const result = await listingRequest<{ template: Template; inherited: boolean }>(`/admin/listing-engine/templates/${id}`);
      const nextRows = withUid(result.template.fields);
      const nextSettings = { name: result.inherited ? fallbackName : result.template.name, config: result.template.config };
      setRows(nextRows); setSettings(nextSettings); setInherited(result.inherited); setVersion(result.inherited ? 0 : result.template.version);
      setBaseline(snapshot(nextRows, nextSettings));
    } catch (e) {
      if (e instanceof ListingError && e.status === 404) {
        const nextSettings = { name: fallbackName, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required' as const, minPrice: 1000 } };
        setRows([]); setSettings(nextSettings); setInherited(false); setVersion(0); setBaseline(snapshot([], nextSettings));
      } else { setError(e instanceof Error ? e.message : 'Không tải được biểu mẫu.'); setRows([]); setSettings(null); }
    } finally { setLoading(false); }
  }, [snapshot]);

  function choose(id: string) {
    if (id === selected) return;
    if (dirty && !window.confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi và chuyển danh mục?')) return;
    const target = cats.find(item => item.id === id);
    setSelected(id); setMessage(''); setReason('');
    if (target) void loadTemplate(id, target.name);
  }

  const tree = useMemo(() => {
    const byParent = new Map<string, AdminCategory[]>();
    for (const item of cats) { const key = item.parentId ?? 'root'; byParent.set(key, [...(byParent.get(key) ?? []), item]); }
    return byParent;
  }, [cats]);
  const matches = useMemo(() => {
    const q = slugify(search, ' ');
    if (!q) return null;
    const hit = new Set<string>();
    for (const item of cats) if (slugify(item.name, ' ').includes(q) || item.slug.includes(slugify(search, '-'))) {
      let cur: AdminCategory | undefined = item;
      while (cur) { hit.add(cur.id); cur = cats.find(x => x.id === cur!.parentId); }
    }
    return hit;
  }, [search, cats]);

  // ---------- field operations ----------
  function patchRow(uidValue: string, patch: Partial<Field>) { setRows(list => list.map(row => (row.uid === uidValue ? { ...row, ...patch } : row))); }
  function patchConfig(row: Row, patch: Record<string, unknown>) {
    const config: Record<string, unknown> = { ...row.config, ...patch };
    for (const key of Object.keys(config)) if (config[key] === undefined || config[key] === '') delete config[key];
    patchRow(row.uid, { config: config as Field['config'] });
  }
  function move(index: number, direction: number) {
    setRows(list => { const next = [...list]; const j = index + direction; if (j < 0 || j >= next.length) return list; [next[index], next[j]] = [next[j], next[index]]; return next; });
  }
  function remove(index: number) {
    const target = rows[index];
    if (!window.confirm(`Xóa trường "${target.label}"? Tin đã đăng vẫn giữ nguyên dữ liệu cũ.`)) return;
    setRows(list => list.filter((_, i) => i !== index).map(row => (row.config.visibleWhen?.field === target.key ? { ...row, config: { ...row.config, visibleWhen: undefined } } : row)));
  }
  function duplicate(index: number) {
    setRows(list => {
      const source = list[index]; const taken = new Set(list.map(row => row.key));
      const label = source.label + ' (bản sao)';
      const copy: Row = { ...source, uid: uid(), isNew: true, label, key: fieldKeyFrom(label, taken), options: source.options.map(o => ({ ...o })), config: { ...source.config } };
      const next = [...list]; next.splice(index + 1, 0, copy); return next;
    });
  }
  function addField(type: string) {
    const taken = new Set(rows.map(row => row.key));
    const label = TYPE_INFO[type].label === 'Số' ? 'Trường số mới' : 'Trường mới';
    const row: Row = { uid: uid(), isNew: true, key: fieldKeyFrom(label, taken), label, type: type as Field['type'], required: false, enabled: true,
      options: HAS_OPTIONS.includes(type) ? [{ value: 'Lựa chọn 1', label: 'Lựa chọn 1' }] : [], config: type === 'year' ? { min: 1950 } : {} };
    setRows(list => [...list, row]); setOpenField(row.uid);
  }
  function changeType(row: Row, type: string) {
    const config: Record<string, unknown> = {};
    if (row.config.help) config.help = row.config.help;
    if (row.config.placeholder) config.placeholder = row.config.placeholder;
    if (row.config.unit && NUMERIC.includes(type)) config.unit = row.config.unit;
    if (row.config.visibleWhen) config.visibleWhen = row.config.visibleWhen;
    patchRow(row.uid, { type: type as Field['type'], config: config as Field['config'], options: HAS_OPTIONS.includes(type) ? (row.options.length ? row.options : [{ value: 'Lựa chọn 1', label: 'Lựa chọn 1' }]) : [] });
  }

  const problem = useMemo(() => {
    if (!settings) return null;
    const known = new Set<string>();
    for (const row of rows) { if (known.has(row.key)) return `Trùng mã trường "${row.key}". Hãy đổi mã ở phần Nâng cao.`; known.add(row.key); }
    for (const [index, row] of rows.entries()) {
      const rule = row.config.visibleWhen;
      if (rule && !rows.slice(0, index).some(prev => prev.key === rule.field)) return `Trường "${row.label}" chỉ hiện theo trường đứng TRƯỚC nó. Hãy đưa trường điều kiện lên trên hoặc bỏ điều kiện.`;
    }
    return validateTemplate({ name: settings.name, fields: stripRows(rows), config: settings.config });
  }, [rows, settings]);

  async function save() {
    if (!settings || !cat) return;
    setError(''); setMessage('');
    if (problem) { setError(problem); return; }
    if (reason.trim().length < 3) { setError('Nhập lý do thay đổi (tối thiểu 3 ký tự) để lưu nhật ký.'); return; }
    setBusy(true);
    try {
      const result = await listingRequest<Template>(`/admin/listing-engine/templates/${cat.id}/versions`, 'POST', { definition: { name: settings.name.trim(), fields: stripRows(rows).map(f => ({ ...f, options: f.options })), config: settings.config, reason: reason.trim() } });
      const nextRows = withUid(result.fields); const nextSettings = { name: result.name, config: result.config };
      setRows(nextRows); setSettings(nextSettings); setInherited(false); setVersion(result.version); setBaseline(snapshot(nextRows, nextSettings)); setReason('');
      setMessage(`Đã lưu thành phiên bản ${result.version}. Áp dụng ngay cho tin đăng mới; tin nháp cũ giữ nguyên biểu mẫu cũ.`);
      void loadCats();
    } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được biểu mẫu.'); } finally { setBusy(false); }
  }

  // ---------- category operations ----------
  async function categoryPatch(id: string, patch: Record<string, unknown>, ok?: string) {
    setBusy(true); setError('');
    try { await listingRequest(`/admin/listing-engine/categories/${id}`, 'PATCH', patch); await loadCats(); if (ok) setMessage(ok); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'Không cập nhật được danh mục.'); return false; }
    finally { setBusy(false); }
  }
  async function shift(item: AdminCategory, direction: number) {
    const siblings = (tree.get(item.parentId ?? 'root') ?? []).slice();
    const i = siblings.findIndex(x => x.id === item.id); const j = i + direction;
    if (i < 0 || j < 0 || j >= siblings.length) return;
    [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
    setBusy(true); setError('');
    try { await listingRequest('/admin/listing-engine/categories/reorder', 'POST', { items: siblings.map((s, index) => ({ id: s.id, sortOrder: index * 10 })) }); await loadCats(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không đổi được thứ tự.'); } finally { setBusy(false); }
  }
  const [newName, setNewName] = useState(''); const [newSlug, setNewSlug] = useState(''); const [newAsChild, setNewAsChild] = useState(true);
  async function createCategory() {
    setBusy(true); setError('');
    try {
      const parentId = newAsChild && cat ? cat.id : undefined;
      const created = await listingRequest<{ id: string }>('/admin/listing-engine/categories', 'POST', { name: newName.trim(), slug: (newSlug || slugify(newName, '-')).trim(), ...(parentId ? { parentId } : {}) });
      setNewName(''); setNewSlug(''); await loadCats(); setSelected(created.id); await loadTemplate(created.id, newName.trim());
      if (parentId) setOpen(o => ({ ...o, [parentId]: true }));
      setMessage('Đã tạo danh mục. Hãy thiết lập các trường rồi bấm Lưu để tạo biểu mẫu riêng.'); setTab('fields');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tạo được danh mục.'); } finally { setBusy(false); }
  }

  // ---------- history ----------
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [restoreReason, setRestoreReason] = useState('');
  useEffect(() => {
    if (tab !== 'history' || !selected) return;
    listingRequest<VersionInfo[]>(`/admin/listing-engine/templates/${selected}/versions`).then(setVersions).catch(() => setVersions([]));
  }, [tab, selected, version]);
  async function restore(v: number) {
    if (!cat) return;
    if (restoreReason.trim().length < 3) { setError('Nhập lý do khôi phục (tối thiểu 3 ký tự).'); return; }
    if (dirty && !window.confirm('Các thay đổi chưa lưu sẽ bị bỏ. Tiếp tục khôi phục?')) return;
    setBusy(true); setError('');
    try {
      await listingRequest(`/admin/listing-engine/templates/${cat.id}/versions/${v}/restore`, 'POST', { reason: restoreReason.trim() });
      await loadTemplate(cat.id, cat.name); await loadCats(); setRestoreReason(''); setMessage(`Đã khôi phục nội dung phiên bản ${v} thành phiên bản mới.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không khôi phục được.'); } finally { setBusy(false); }
  }

  // ---------- preview ----------
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});

  function renderNode(item: AdminCategory, depth = 0) {
    const kids = tree.get(item.id) ?? [];
    if (matches && !matches.has(item.id)) return null;
    const expanded = matches ? true : !!open[item.id];
    const siblings = tree.get(item.parentId ?? 'root') ?? []; const pos = siblings.findIndex(x => x.id === item.id);
    return <div key={item.id}>
      <div className={`fb-node ${selected === item.id ? 'on' : ''} ${item.status !== 'ACTIVE' ? 'off' : ''}`} onClick={() => choose(item.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') choose(item.id); }}>
        {kids.length ? <button type="button" className="fb-caret" aria-label="Mở rộng" onClick={e => { e.stopPropagation(); setOpen(o => ({ ...o, [item.id]: !expanded })); }}>{expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</button> : <span style={{ width: 18 }} />}
        <span className="nm" title={item.name}>{item.name}</span>
        {item.status !== 'ACTIVE' && <span className="tg none">Ẩn</span>}
        {item.editedByAdmin ? <span className="tg mod" title="Đã chỉnh sửa trong trang quản trị">Đã sửa</span> : item.hasTemplate ? <span className="tg own">{item.fieldCount} trường</span> : <span className="tg" title="Dùng biểu mẫu của danh mục cha">Kế thừa</span>}
        <span style={{ display: 'flex' }} onClick={e => e.stopPropagation()}>
          <button type="button" className="fb-mini" disabled={busy || pos <= 0} aria-label="Lên" onClick={() => shift(item, -1)}><ArrowUp size={13} /></button>
          <button type="button" className="fb-mini" disabled={busy || pos < 0 || pos >= siblings.length - 1} aria-label="Xuống" onClick={() => shift(item, 1)}><ArrowDown size={13} /></button>
        </span>
      </div>
      {kids.length > 0 && expanded && <div className="fb-kids">{kids.map(kid => renderNode(kid, depth + 1))}</div>}
    </div>;
  }

  const roots = tree.get('root') ?? [];
  const priorFields = (index: number) => rows.slice(0, index);

  return <div className="fb">
    <div className="fb-head"><div><h1>Quản lý danh mục & biểu mẫu đăng tin</h1><p>Thêm, sửa, sắp xếp trường dữ liệu bằng giao diện trực quan — không cần chỉnh code. Mỗi lần lưu tạo một phiên bản mới, có thể khôi phục.</p></div></div>
    {error && <div role="alert" className="fb-msg err">{error}</div>}
    {message && <div role="status" className="fb-msg ok">{message}</div>}
    <div className="fb-layout">
      <aside className="fb-card fb-tree">
        <input className="fb-tree-search" placeholder="Tìm danh mục…" value={search} onChange={e => setSearch(e.target.value)} />
        {roots.map(item => renderNode(item))}
        {!cats.length && <p style={{ color: '#7a8b82' }}>Đang tải danh mục…</p>}
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#137a4a' }}><FolderPlus size={14} style={{ verticalAlign: -2 }} /> Thêm danh mục mới</summary>
          <div style={{ marginTop: 10 }}>
            <div className="fb-f"><label>Tên danh mục</label><input value={newName} maxLength={100} onChange={e => { setNewName(e.target.value); setNewSlug(slugify(e.target.value, '-')); }} /></div>
            <div className="fb-f"><label>Mã (tự tạo, không dấu)</label><input value={newSlug} maxLength={120} onChange={e => setNewSlug(e.target.value)} /></div>
            <label className="fb-chk"><input type="checkbox" checked={newAsChild} disabled={!cat} onChange={e => setNewAsChild(e.target.checked)} />Đặt trong “{cat?.name ?? 'chưa chọn'}”</label>
            <button type="button" className="fb-btn primary" disabled={busy || !newName.trim()} onClick={createCategory}><Plus size={14} />Tạo danh mục</button>
          </div>
        </details>
      </aside>

      <section className="fb-card" style={{ minWidth: 0 }}>
        {!cat && <div className="fb-msg info">Chọn một danh mục ở cột bên trái để chỉnh biểu mẫu.</div>}
        {cat && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div><h2 style={{ margin: 0, fontSize: 20 }}>{cat.name}</h2><small style={{ color: '#7a8b82' }}>{cat.slug} · {cat.listingCount} tin đã đăng · {version ? `Phiên bản ${version}` : 'chưa có phiên bản riêng'}{dirty ? ' · ● chưa lưu' : ''}</small></div>
          </div>
          {inherited && <div className="fb-msg info" style={{ marginTop: 12 }}>Danh mục này đang dùng biểu mẫu kế thừa từ danh mục cha. Chỉnh sửa và bấm Lưu để tạo biểu mẫu riêng cho “{cat.name}”.</div>}
          <div className="fb-tabs" role="tablist">
            {([['fields', `Trường dữ liệu (${rows.length})`], ['settings', 'Cài đặt chung'], ['preview', 'Xem trước'], ['category', 'Thông tin danh mục'], ['history', 'Lịch sử phiên bản']] as const).map(([key, label]) =>
              <button key={key} type="button" role="tab" aria-selected={tab === key} className={`fb-tab ${tab === key ? 'on' : ''}`} onClick={() => setTab(key)}>{label}</button>)}
          </div>
          {loading && <p>Đang tải biểu mẫu…</p>}

          {!loading && settings && tab === 'fields' && <div>
            {rows.map((row, index) => {
              const isOpen = openField === row.uid; const before = priorFields(index);
              const dep = row.config.visibleWhen ? rows.find(x => x.key === row.config.visibleWhen!.field) : undefined;
              return <div key={row.uid} className={`fb-field ${isOpen ? 'open' : ''} ${row.enabled ? '' : 'off'}`}>
                <div className="fb-fh" onClick={() => setOpenField(isOpen ? '' : row.uid)}>
                  <span className="ix">{index + 1}</span><span className="lb">{row.label || '(chưa đặt tên)'}</span>
                  <span className="fb-pill">{TYPE_INFO[row.type]?.label ?? row.type}</span>
                  {row.required && <span className="fb-pill req">Bắt buộc</span>}
                  {row.config.visibleWhen && <span className="fb-pill cond">Có điều kiện</span>}
                  {!row.enabled && <span className="fb-pill">Đang ẩn</span>}
                  <span style={{ display: 'flex' }} onClick={e => e.stopPropagation()}>
                    <button type="button" className="fb-mini" disabled={index === 0} aria-label="Lên" onClick={() => move(index, -1)}><ArrowUp size={15} /></button>
                    <button type="button" className="fb-mini" disabled={index === rows.length - 1} aria-label="Xuống" onClick={() => move(index, 1)}><ArrowDown size={15} /></button>
                    <button type="button" className="fb-mini" aria-label={row.enabled ? 'Ẩn trường' : 'Hiện trường'} title={row.enabled ? 'Ẩn trường' : 'Hiện trường'} onClick={() => patchRow(row.uid, { enabled: !row.enabled })}>{row.enabled ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                    <button type="button" className="fb-mini" aria-label="Nhân bản" onClick={() => duplicate(index)}><Copy size={15} /></button>
                    <button type="button" className="fb-mini" aria-label="Xóa" onClick={() => remove(index)}><Trash2 size={15} /></button>
                  </span>
                </div>
                {isOpen && <div className="fb-fb">
                  <div className="fb-row">
                    <div className="fb-f"><label>Nhãn hiển thị *</label><input value={row.label} maxLength={150} onChange={e => {
                      const label = e.target.value;
                      patchRow(row.uid, row.isNew ? { label, key: fieldKeyFrom(label, new Set(rows.filter(x => x.uid !== row.uid).map(x => x.key))) } : { label });
                    }} /></div>
                    <div className="fb-f"><label>Kiểu nhập liệu</label><select value={row.type} onChange={e => changeType(row, e.target.value)}>{Object.entries(TYPE_INFO).map(([value, info]) => <option key={value} value={value}>{info.label}</option>)}</select><small>{TYPE_INFO[row.type]?.hint}</small></div>
                  </div>
                  <label className="fb-chk"><input type="checkbox" checked={row.required} onChange={e => patchRow(row.uid, { required: e.target.checked })} />Bắt buộc nhập</label>
                  <label className="fb-chk"><input type="checkbox" checked={row.enabled} onChange={e => patchRow(row.uid, { enabled: e.target.checked })} />Hiển thị trong form</label>

                  <div className="fb-row" style={{ marginTop: 10 }}>
                    {!['select', 'radio', 'multi-select', 'boolean', 'checkbox', 'date', 'image', 'video', 'location'].includes(row.type) && <div className="fb-f"><label>Gợi ý trong ô nhập</label><input value={row.config.placeholder ?? ''} maxLength={200} onChange={e => patchConfig(row, { placeholder: e.target.value })} /></div>}
                    <div className="fb-f"><label>Dòng hướng dẫn dưới ô</label><input value={row.config.help ?? ''} maxLength={300} onChange={e => patchConfig(row, { help: e.target.value })} /></div>
                    {(NUMERIC.includes(row.type) || TEXTUAL.includes(row.type)) && <div className="fb-f"><label>Đơn vị (km, m², năm…)</label><input value={row.config.unit ?? ''} maxLength={20} onChange={e => patchConfig(row, { unit: e.target.value })} /></div>}
                  </div>

                  {NUMERIC.includes(row.type) && <div className="fb-row">
                    <div className="fb-f"><label>Giá trị nhỏ nhất</label><input type="number" value={row.config.min ?? ''} onChange={e => patchConfig(row, { min: num(e.target.value) })} /></div>
                    <div className="fb-f"><label>Giá trị lớn nhất</label><input type="number" value={row.config.max ?? ''} onChange={e => patchConfig(row, { max: num(e.target.value) })} /></div>
                    {row.type !== 'year' && row.type !== 'currency' && <div className="fb-f"><label>Kiểu số</label><label className="fb-chk" style={{ marginTop: 8 }}><input type="checkbox" checked={!!row.config.integer} onChange={e => patchConfig(row, { integer: e.target.checked ? true : undefined })} />Chỉ số nguyên (không có phần lẻ)</label></div>}
                  </div>}
                  {TEXTUAL.includes(row.type) && <div className="fb-row">
                    <div className="fb-f"><label>Số ký tự tối thiểu</label><input type="number" min={0} value={row.config.minLength ?? ''} onChange={e => patchConfig(row, { minLength: num(e.target.value) })} /></div>
                    <div className="fb-f"><label>Số ký tự tối đa</label><input type="number" min={1} max={10000} value={row.config.maxLength ?? ''} onChange={e => patchConfig(row, { maxLength: num(e.target.value) })} /></div>
                  </div>}

                  {HAS_OPTIONS.includes(row.type) && <OptionsEditor row={row} onChange={options => patchRow(row.uid, { options })} />}

                  <div className="fb-f" style={{ marginTop: 6 }}>
                    <label>Điều kiện hiển thị</label>
                    {!row.config.visibleWhen && <div><button type="button" className="fb-btn sm" disabled={!before.length} onClick={() => patchConfig(row, { visibleWhen: { field: before[before.length - 1].key, operator: 'eq', value: '' } })}>+ Chỉ hiện khi…</button>{!before.length && <small> (cần có trường đứng trước)</small>}</div>}
                    {row.config.visibleWhen && <div className="fb-inline">
                      <span>Chỉ hiện khi</span>
                      <select style={{ width: 'auto' }} value={row.config.visibleWhen.field} onChange={e => patchConfig(row, { visibleWhen: { field: e.target.value, operator: 'eq', value: '' } })}>
                        {before.map(p => <option key={p.uid} value={p.key}>{p.label}</option>)}
                      </select>
                      <select style={{ width: 'auto' }} value={row.config.visibleWhen.operator} onChange={e => patchConfig(row, { visibleWhen: { ...row.config.visibleWhen, operator: e.target.value, value: e.target.value === 'in' ? [] : '' } })}>
                        {OPERATORS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                      <ConditionValue dep={dep} rule={row.config.visibleWhen} onChange={value => patchConfig(row, { visibleWhen: { ...row.config.visibleWhen, value } })} />
                      <button type="button" className="fb-btn sm danger" onClick={() => patchConfig(row, { visibleWhen: undefined })}>Bỏ điều kiện</button>
                    </div>}
                  </div>

                  <details><summary style={{ cursor: 'pointer', fontSize: 12, color: '#7a8b82' }}>Nâng cao</summary>
                    <div className="fb-f" style={{ marginTop: 8 }}><label>Mã trường (dùng để lưu dữ liệu)</label>
                      <input value={row.key} maxLength={64} disabled={!row.isNew} onChange={e => patchRow(row.uid, { key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} />
                      <small>{row.isNew ? 'Tự tạo từ nhãn cho trường mới. Chỉ gồm a–z, 0–9, gạch dưới.' : 'Trường đã lưu: giữ nguyên mã để không mất dữ liệu của các tin đã đăng.'}</small></div>
                  </details>
                </div>}
              </div>;
            })}
            {!rows.length && <div className="fb-msg info">Danh mục chưa có trường nào. Chọn kiểu dữ liệu bên dưới để thêm trường đầu tiên.</div>}
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#44604f' }}>Thêm trường mới {rows.length >= 80 && '(đã đạt tối đa 80 trường)'}</div>
            <div className="fb-types">{PALETTE.map(type => <button type="button" key={type} className="fb-type" disabled={rows.length >= 80} onClick={() => addField(type)}><b>+ {TYPE_INFO[type].label}</b><span>{TYPE_INFO[type].hint}</span></button>)}</div>
          </div>}

          {!loading && settings && tab === 'settings' && <div>
            <div className="fb-f"><label>Tên biểu mẫu</label><input value={settings.name} maxLength={150} onChange={e => setSettings({ ...settings, name: e.target.value })} /></div>
            <div className="fb-f"><label>Cách tính giá cho phép *</label><div>
              {Object.entries(priceLabels).map(([mode, label]) => <label key={mode} className="fb-chk"><input type="checkbox" checked={settings.config.priceModes.includes(mode)} onChange={e => setSettings({ ...settings, config: { ...settings.config, priceModes: e.target.checked ? [...settings.config.priceModes, mode] : settings.config.priceModes.filter(m => m !== mode) } })} />{label}</label>)}
            </div><small>Người đăng chọn 1 trong các cách tính này. Thứ tự hiển thị theo thứ tự bạn tích chọn.</small></div>
            <div className="fb-f"><label>Tình trạng hàng (mới / cũ)</label><div>
              <label className="fb-chk"><input type="radio" name="cond" checked={settings.config.condition !== 'none'} onChange={() => setSettings({ ...settings, config: { ...settings.config, condition: 'required' } })} />Bắt buộc chọn (đồ vật, xe cộ…)</label>
              <label className="fb-chk"><input type="radio" name="cond" checked={settings.config.condition === 'none'} onChange={() => setSettings({ ...settings, config: { ...settings.config, condition: 'none' } })} />Không áp dụng (dịch vụ, bất động sản…)</label></div></div>
            <div className="fb-row">
              <div className="fb-f"><label>Giá tối thiểu (VNĐ)</label><input type="number" min={0} value={settings.config.minPrice ?? ''} onChange={e => setSettings({ ...settings, config: { ...settings.config, minPrice: num(e.target.value) } })} /><small>{money(settings.config.minPrice)}</small></div>
              <div className="fb-f"><label>Giá tối đa (VNĐ)</label><input type="number" min={0} value={settings.config.maxPrice ?? ''} onChange={e => setSettings({ ...settings, config: { ...settings.config, maxPrice: num(e.target.value) } })} /><small>{settings.config.maxPrice ? money(settings.config.maxPrice) : 'Để trống = không giới hạn thêm'}</small></div>
            </div>
          </div>}

          {!loading && settings && tab === 'preview' && <div>
            <div className="fb-msg info">Đây là bản xem trước các trường dữ liệu chuyên biệt đúng như người bán sẽ thấy. Thử nhập để kiểm tra điều kiện hiển thị và kiểm tra hợp lệ.</div>
            <div className="fb-prev lf-page" style={{ padding: 18 }}>
              {rows.filter(f => visible(f, previewValues, stripRows(rows)) && !['image', 'video'].includes(f.type)).map(f => {
                const { uid: _u, isNew: _n, ...field } = f;
                return <DynamicField key={f.uid} field={field} value={previewValues[f.key]} allValues={previewValues} onChange={value => setPreviewValues(v => ({ ...v, [f.key]: value }))} />;
              })}
              {!rows.some(f => f.enabled) && <p style={{ color: '#7a8b82' }}>Chưa có trường nào đang hiển thị.</p>}
            </div>
          </div>}

          {tab === 'category' && <div>
            <CategoryForm key={cat.id + cat.name + cat.status} cat={cat} busy={busy} onSave={patch => categoryPatch(cat.id, patch, 'Đã cập nhật danh mục.')} />
          </div>}

          {tab === 'history' && <div>
            <div className="fb-f"><label>Lý do khôi phục</label><input value={restoreReason} maxLength={300} placeholder="Ví dụ: hoàn tác chỉnh sửa nhầm" onChange={e => setRestoreReason(e.target.value)} /></div>
            <table className="fb-hist"><thead><tr><th>Phiên bản</th><th>Ngày lưu</th><th>Số trường</th><th>Ghi chú</th><th /></tr></thead><tbody>
              {versions.map(v => <tr key={v.version}><td><b>v{v.version}</b> {v.active && <span className="fb-pill req" style={{ background: '#dff3e6', color: '#137a4a' }}>Đang dùng</span>}</td>
                <td>{new Date(v.createdAt).toLocaleString('vi-VN')}</td><td>{v.fieldCount}</td><td>{v.reason ?? (v.byAdmin ? '' : 'Mẫu mặc định của hệ thống')}</td>
                <td>{!v.active && <button type="button" className="fb-btn sm" disabled={busy} onClick={() => restore(v.version)}>Khôi phục</button>}</td></tr>)}
              {!versions.length && <tr><td colSpan={5} style={{ color: '#7a8b82' }}>Chưa có phiên bản riêng.</td></tr>}
            </tbody></table>
          </div>}

          {(tab === 'fields' || tab === 'settings') && settings && <div className="fb-bar">
            <input placeholder="Lý do thay đổi (bắt buộc, để ghi nhật ký)" maxLength={400} value={reason} onChange={e => setReason(e.target.value)} />
            {problem && <span style={{ color: '#a64329', fontSize: 12, flexBasis: '100%' }}><Ic i={TriangleAlert}/>{problem}</span>}
            <button type="button" className="fb-btn" disabled={!dirty || busy} onClick={() => void loadTemplate(cat.id, cat.name)}>Hủy thay đổi</button>
            <button type="button" className="fb-btn primary" disabled={busy || !!problem || (!dirty && !inherited && !!version)} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu phiên bản mới'}</button>
          </div>}
        </>}
      </section>
    </div>
  </div>;
}

function OptionsEditor({ row, onChange }: { row: Row; onChange: (options: Field['options']) => void }) {
  const [bulk, setBulk] = useState('');
  function setLabel(index: number, label: string) {
    onChange(row.options.map((o, i) => (i === index ? { ...o, label, value: row.isNew || o.value === o.label ? label : o.value } : o)));
  }
  function addBulk() {
    const taken = new Set(row.options.map(o => o.value));
    const added = bulk.split('\n').map(l => l.trim()).filter(Boolean).filter(l => !taken.has(l)).map(l => ({ value: l, label: l }));
    onChange([...row.options, ...added].slice(0, 100)); setBulk('');
  }
  const dup = row.options.some((o, i) => row.options.findIndex(x => x.value === o.value) !== i);
  return <div className="fb-f"><label>Các lựa chọn</label>
    {row.options.map((option, index) => <div key={index} className="fb-opt">
      <input value={option.label} maxLength={120} onChange={e => setLabel(index, e.target.value)} aria-label={`Lựa chọn ${index + 1}`} />
      <button type="button" className="fb-mini" disabled={index === 0} aria-label="Lên" onClick={() => { const next = [...row.options]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(next); }}><ArrowUp size={14} /></button>
      <button type="button" className="fb-mini" disabled={index === row.options.length - 1} aria-label="Xuống" onClick={() => { const next = [...row.options]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; onChange(next); }}><ArrowDown size={14} /></button>
      <button type="button" className="fb-mini" aria-label="Xóa lựa chọn" onClick={() => onChange(row.options.filter((_, i) => i !== index))}><Trash2 size={14} /></button>
    </div>)}
    {dup && <small style={{ color: '#b53434' }}>Có lựa chọn bị trùng giá trị — hãy đổi tên.</small>}
    <div><button type="button" className="fb-btn sm" disabled={row.options.length >= 100} onClick={() => onChange([...row.options, { value: 'Lựa chọn ' + (row.options.length + 1), label: 'Lựa chọn ' + (row.options.length + 1) }])}>+ Thêm lựa chọn</button></div>
    <details style={{ marginTop: 6 }}><summary style={{ cursor: 'pointer', fontSize: 12, color: '#7a8b82' }}>Dán nhiều lựa chọn (mỗi dòng một mục)</summary>
      <textarea rows={4} value={bulk} onChange={e => setBulk(e.target.value)} /><button type="button" className="fb-btn sm" style={{ marginTop: 6 }} disabled={!bulk.trim()} onClick={addBulk}>Thêm vào danh sách</button></details>
    {row.options.some(o => o.parentOptionId) && <small>Các lựa chọn phụ thuộc (ví dụ dòng xe theo hãng) được giữ nguyên liên kết cha khi lưu.</small>}
  </div>;
}

function ConditionValue({ dep, rule, onChange }: { dep?: Row; rule: NonNullable<Field['config']['visibleWhen']>; onChange: (value: unknown) => void }) {
  const options = dep?.options ?? [];
  if (rule.operator === 'in') {
    const current = Array.isArray(rule.value) ? (rule.value as unknown[]) : [];
    if (options.length) return <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{options.map(o => <label key={o.value} className="fb-chk" style={{ margin: 0 }}><input type="checkbox" checked={current.includes(o.value)} onChange={e => onChange(e.target.checked ? [...current, o.value] : current.filter(v => v !== o.value))} />{o.label}</label>)}</span>;
    return <input style={{ width: 220 }} placeholder="giá trị 1, giá trị 2" value={current.join(', ')} onChange={e => onChange(e.target.value.split(',').map(v => v.trim()).filter(Boolean))} />;
  }
  if (dep && ['boolean', 'checkbox'].includes(dep.type)) return <select style={{ width: 'auto' }} value={String(rule.value)} onChange={e => onChange(e.target.value === 'true')}><option value="true">Có</option><option value="false">Không</option></select>;
  if (options.length) return <select style={{ width: 'auto' }} value={String(rule.value ?? '')} onChange={e => onChange(e.target.value)}><option value="">— chọn —</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
  if (dep && NUMERIC.includes(dep.type)) return <input type="number" style={{ width: 140 }} value={typeof rule.value === 'number' ? rule.value : ''} onChange={e => onChange(num(e.target.value) ?? '')} />;
  return <input style={{ width: 200 }} value={String(rule.value ?? '')} onChange={e => onChange(e.target.value)} />;
}

function CategoryForm({ cat, busy, onSave }: { cat: AdminCategory; busy: boolean; onSave: (patch: Record<string, unknown>) => Promise<boolean | undefined> }) {
  const [name, setName] = useState(cat.name); const [icon, setIcon] = useState(cat.iconUrl ?? ''); const [desc, setDesc] = useState(cat.description ?? '');
  return <div>
    <div className="fb-row">
      <div className="fb-f"><label>Tên danh mục</label><input value={name} maxLength={100} onChange={e => setName(e.target.value)} /></div>
      <div className="fb-f"><label>Mã danh mục</label><input value={cat.slug} disabled /><small>Mã cố định để không hỏng liên kết.</small></div>
    </div>
    <div className="fb-f"><label>Đường dẫn biểu tượng (tùy chọn)</label><input value={icon} maxLength={500} placeholder="/assets/category-icons/..." onChange={e => setIcon(e.target.value)} /></div>
    <div className="fb-f"><label>Mô tả ngắn</label><textarea rows={2} maxLength={500} value={desc} onChange={e => setDesc(e.target.value)} /></div>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <button type="button" className="fb-btn primary" disabled={busy || !name.trim()} onClick={() => onSave({ name: name.trim(), iconUrl: icon.trim(), description: desc.trim() })}>Lưu thông tin</button>
      <button type="button" className={`fb-btn ${cat.status === 'ACTIVE' ? 'danger' : ''}`} disabled={busy} onClick={() => {
        if (cat.status === 'ACTIVE' && !window.confirm(`Ẩn “${cat.name}” và mọi danh mục con khỏi trang đăng tin và trang chủ? Tin đã đăng không bị xóa.`)) return;
        void onSave({ status: cat.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE' });
      }}>{cat.status === 'ACTIVE' ? 'Ẩn danh mục' : 'Hiện lại danh mục'}</button>
    </div>
    <small style={{ display: 'block', marginTop: 10, color: '#7a8b82' }}>Danh mục không bị xóa cứng để bảo toàn tin đã đăng; hãy dùng “Ẩn” khi không còn sử dụng. Đổi thứ tự bằng mũi tên ở cột trái.</small>
  </div>;
}
