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
