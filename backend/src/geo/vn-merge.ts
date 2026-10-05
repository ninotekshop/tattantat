import { VN_MERGE } from './vn-merge.data';

export interface NewAdmin { provinceCode?: string; province?: string; wardCode?: string; ward?: string }

/** Tra đơn vị hành chính MỚI (sau sáp nhập 01/07/2025) từ tên tỉnh/huyện/phường CŨ. Không khớp thì trả về trống. */
export function toNewAdmin(province?: string, district?: string, ward?: string): NewAdmin {
  const out: NewAdmin = {};
  const p = province ? VN_MERGE.p[province] : undefined;
  if (p) { out.provinceCode = p[0]; out.province = p[1]; }
  const dc = province && district ? VN_MERGE.d[`${province}|${district}`] : undefined;
  const w = dc && ward ? VN_MERGE.w[dc]?.[ward] : undefined;
  if (w) { out.wardCode = w[0]; out.ward = w[1]; }
  return out;
}

/** Nhãn hiển thị kiểu "Bình Định (Gia Lai mới)"; chỉ thêm phần mới khi tên khác tên cũ. */
const core = (s: string) => s.trim().toLowerCase().replace(/^(tp\.|thành phố|tỉnh)\s+/, '');
export function withNew(old?: string, now?: string): string {
  if (!old) return now ?? '';
  if (!now || core(now) === core(old)) return old;
  return `${old} (${now} mới)`;
}

const strip = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/^(tinh|thanh pho|tp\.?|thi xa|thi tran|huyen|quan|phuong|xa|tx\.?|tt\.?)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
let idx: { p: Map<string, string>; d: Map<string, string>; w: Map<string, Map<string, [string, string]>> } | null = null;
function index() {
  if (idx) return idx;
  const p = new Map<string, string>(), d = new Map<string, string>(), w = new Map<string, Map<string, [string, string]>>();
  for (const name of Object.keys(VN_MERGE.p)) p.set(strip(name), name);
  for (const [k, dc] of Object.entries(VN_MERGE.d)) { const [pn, dn] = k.split('|'); d.set(strip(pn) + '|' + strip(dn), dc); }
  for (const [dc, m] of Object.entries(VN_MERGE.w)) w.set(dc, new Map(Object.entries(m).map(([wn, v]) => [strip(wn), v] as [string, [string, string]])));
  idx = { p, d, w };
  return idx;
}

/** Chuyển địa chỉ dạng "Phường, Huyện, Tỉnh" (tên cũ, có/không có "Tỉnh", "Thành phố"…) sang "Phường (Phường mới mới), Huyện, Tỉnh (Tỉnh mới mới)". Trả về null nếu không đổi / không khớp / đã chuyển. */
export function convertAddress(address?: string | null): string | null {
  if (!address || / mới\)/.test(address)) return null;
  const parts = address.split(',').map(x => x.trim()).filter(Boolean);
  const { p, d, w } = index();
  let pi = -1, provKey = '';
  for (let i = parts.length - 1; i >= 0 && pi < 0; i--) { const k = p.get(strip(parts[i])); if (k) { pi = i; provKey = k; } }
  if (pi < 0) return null;
  const out = parts.slice();
  out[pi] = withNew(parts[pi], VN_MERGE.p[provKey][1]);
  const di = pi - 1;
  if (di >= 1) {
    const dc = d.get(strip(provKey) + '|' + strip(parts[di]));
    const nw = dc ? w.get(dc)?.get(strip(parts[di - 1])) : undefined;
    if (nw) out[di - 1] = withNew(parts[di - 1], nw[1]);
  }
  const res = out.join(', ');
  return res === address ? null : res;
}

// ---- Hiển thị gọn trên thẻ tin: "P. Trần Phú (P. Quy Nhơn mới)" ----
const ABBR: [RegExp, string][] = [[/^phường\s+/i, 'P. '], [/^xã\s+/i, 'X. '], [/^thị trấn\s+/i, 'TT. '], [/^đặc khu\s+/i, 'ĐK. ']];
const abbr = (s: string) => { for (const [r, a] of ABBR) if (r.test(s)) return s.replace(r, a); return s; };
const noteRe = /\s*\(([^)]*?)\s+mới\)\s*$/i;

let loc: { provNew: Map<string, string>; byNewProv: Map<string, { wards: Map<string, [string, string]>; newWards: Map<string, string> }> } | null = null;
function locIndex() {
  if (loc) return loc;
  const provNew = new Map<string, string>(); // strip(tên tỉnh cũ hoặc mới) -> mã tỉnh mới
  for (const [oldName, [code, newName]] of Object.entries(VN_MERGE.p)) { provNew.set(strip(oldName), code); provNew.set(strip(newName), code); }
  const byNewProv = new Map<string, { wards: Map<string, [string, string]>; newWards: Map<string, string> }>();
  for (const [k, dc] of Object.entries(VN_MERGE.d)) {
    const code = VN_MERGE.p[k.split('|')[0]]?.[0];
    if (!code) continue;
    const e = byNewProv.get(code) ?? { wards: new Map(), newWards: new Map() };
    for (const [oldWard, nw] of Object.entries(VN_MERGE.w[dc] ?? {})) {
      const key = strip(oldWard);
      if (!e.wards.has(key)) e.wards.set(key, [oldWard, nw[1]]);
      e.newWards.set(strip(nw[1]), nw[1]);
    }
    byNewProv.set(code, e);
  }
  loc = { provNew, byNewProv };
  return loc;
}

/** Hiển thị gọn cho thẻ tin; trả về null nếu không nhận ra khu vực (khi đó dùng địa chỉ đầy đủ). */
export function compactLocation(address?: string | null): string | null {
  if (!address) return null;
  const { provNew, byNewProv } = locIndex();
  const parts = address.split(',').map(x => x.trim()).filter(Boolean).map(p => ({ base: p.replace(noteRe, '').trim(), note: noteRe.exec(p)?.[1] }));
  let pi = -1, code = '';
  for (let i = parts.length - 1; i >= 0 && pi < 0; i--) { const c = provNew.get(strip(parts[i].base)); if (c) { pi = i; code = c; } }
  if (pi < 0) return null;
  const provNewName = VN_MERGE.np[code];
  const idx = byNewProv.get(code);
  if (!provNewName || !idx) return null;
  for (let i = 0; i < parts.length; i++) {
    if (i === pi) continue;
    const { base, note } = parts[i];
    const m = idx.wards.get(strip(base));
    if (note && m) return `${abbr(m[0])} (${abbr(note)} mới)`;
    if (m) return core(m[1]) === core(m[0]) ? `${abbr(m[1])}, ${provNewName} mới` : `${abbr(m[0])} (${abbr(m[1])} mới)`;
  }
  for (let i = 0; i < parts.length; i++) {
    if (i === pi) continue;
    const nw = idx.newWards.get(strip(parts[i].base));
    if (nw) return `${abbr(nw)} mới, ${provNewName} mới`;
  }
  return null;
}
