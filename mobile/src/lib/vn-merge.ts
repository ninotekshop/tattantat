// Đối chiếu đơn vị hành chính cũ -> mới (sau sáp nhập 01/07/2025).
import merge from '../data/vn-merge-map.json';
import wards from '../data/vn-wards.json';

type Merge = { p: Record<string, [string, string]>; w: Record<string, Record<string, [string, string]>>; np: Record<string, string> };
const M = merge as unknown as Merge;
const WARDS = wards as unknown as Record<string, string[]>;

const core = (s: string) => s.trim().toLowerCase().replace(/^(tp\.|thành phố|tỉnh)\s+/, '');
/** "Bình Định (Gia Lai mới)": chỉ thêm phần mới khi tên mới khác tên cũ. */
export function withNew(oldName: string, newName?: string | null): string {
  if (!newName || core(newName) === core(oldName)) return oldName;
  return `${oldName} (${newName} mới)`;
}
export const provinceLabel = (oldName: string, oldCode: string) => withNew(oldName, M.p[oldCode]?.[1]);
export const wardLabel = (oldWard: string, districtCode?: string) => withNew(oldWard, districtCode ? M.w[districtCode]?.[oldWard]?.[1] : undefined);
export const wardsOfDistrict = (districtCode?: string): string[] => (districtCode ? WARDS[districtCode] ?? [] : []);
/** Tên tỉnh/thành mới theo mã tỉnh cũ (dùng để tìm kiếm theo tên mới). */
export const newProvinceName = (oldCode: string) => M.p[oldCode]?.[1];
