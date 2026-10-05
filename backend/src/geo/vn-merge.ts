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
