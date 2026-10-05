// Đối chiếu đơn vị hành chính cũ -> mới (sau sáp nhập 01/07/2025). Dữ liệu tải 1 lần từ /data/vn-merge-map.json.
export interface VnMergeMap {
  p: Record<string, [string, string]>; // mã tỉnh cũ -> [mã tỉnh mới, tên mới]
  w: Record<string, Record<string, [string, string]>>; // mã huyện cũ -> { tên phường cũ: [mã phường mới, tên mới] }
  np: Record<string, string>;
}

let cache: VnMergeMap | null = null;
let pending: Promise<VnMergeMap | null> | null = null;

export function getVnMerge(): VnMergeMap | null { return cache; }

export function loadVnMerge(): Promise<VnMergeMap | null> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch('/data/vn-merge-map.json')
      .then(r => (r.ok ? r.json() : null))
      .then((j: VnMergeMap | null) => { cache = j; return j; })
      .catch(() => null);
  }
  return pending;
}

/** "Bình Định (Gia Lai mới)": chỉ thêm phần mới khi tên mới khác tên cũ. */
const core = (s: string) => s.trim().toLowerCase().replace(/^(tp\.|thành phố|tỉnh)\s+/, '');
export function withNew(oldName: string, newName?: string | null): string {
  if (!newName || core(newName) === core(oldName)) return oldName;
  return `${oldName} (${newName} mới)`;
}

export function provinceLabel(oldName: string, oldCode: string, m: VnMergeMap | null): string {
  return withNew(oldName, m?.p[oldCode]?.[1]);
}

export function wardLabel(oldWard: string, districtCode: string | undefined, m: VnMergeMap | null): string {
  return withNew(oldWard, districtCode ? m?.w[districtCode]?.[oldWard]?.[1] : undefined);
}
