/** Cấu hình bộ lọc & công thức cho các chuyên mục chuyên sâu (Bất động sản, Ô tô). */
export type FilterDef =
  | { kind: 'range'; key: string; label: string; unit?: string; placeholder?: [string, string] }
  | { kind: 'min'; key: string; label: string; options: number[]; suffix?: string }
  | { kind: 'max'; key: string; label: string; unit?: string; placeholder?: string }
  | { kind: 'select'; key: string; label: string; options: string[] };
export type Vertical = { slug: string; title: string; subtitle: string; tabs: { slug: string; name: string }[]; filters: (tab: string) => FilterDef[]; highlight: (tab: string) => { key: string; label: string; unit?: string }[] };

const DIRECTIONS = ['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Bắc', 'Đông Nam', 'Tây Bắc', 'Tây Nam'];
const LEGAL = ['Sổ đỏ / Sổ hồng', 'Hợp đồng mua bán', 'Giấy tờ viết tay', 'Đang chờ cấp sổ'];

export const PROPERTY_VERTICAL: Vertical = {
  slug: 'bat-dong-san', title: 'Bất động sản', subtitle: 'Mua bán, cho thuê nhà đất, căn hộ, phòng trọ, mặt bằng',
  tabs: [{ slug: 'bat-dong-san', name: 'Tất cả' }, { slug: 'ban-nha', name: 'Bán nhà' }, { slug: 'ban-dat', name: 'Bán đất' }, { slug: 'can-ho', name: 'Căn hộ' }, { slug: 'phong-tro', name: 'Phòng trọ' }, { slug: 'cho-thue-nha', name: 'Cho thuê nhà' }, { slug: 'cho-thue-mat-bang', name: 'Mặt bằng' }, { slug: 'van-phong', name: 'Văn phòng' }],
  filters: tab => {
    const area = tab === 'ban-dat' ? 'area' : tab === 'ban-nha' ? 'land_area' : 'area';
    const list: FilterDef[] = [{ kind: 'range', key: area, label: 'Diện tích', unit: 'm²' }];
    if (['bat-dong-san', 'ban-nha', 'can-ho', 'cho-thue-nha'].includes(tab)) list.push({ kind: 'min', key: 'bedrooms', label: 'Phòng ngủ', options: [1, 2, 3, 4, 5], suffix: '+' });
    if (tab !== 'phong-tro' && tab !== 'cho-thue-nha' && tab !== 'cho-thue-mat-bang') list.push({ kind: 'select', key: 'legal', label: 'Pháp lý', options: LEGAL });
    if (['ban-nha', 'ban-dat', 'can-ho', 'cho-thue-nha'].includes(tab)) list.push({ kind: 'select', key: 'direction', label: 'Hướng', options: DIRECTIONS });
    return list;
  },
  highlight: tab => [{ key: tab === 'ban-nha' ? 'land_area' : 'area', label: 'Diện tích', unit: 'm²' }, { key: 'bedrooms', label: 'PN' }, { key: 'legal', label: '' }],
};

export const VEHICLE_VERTICAL: Vertical = {
  slug: 'o-to', title: 'Ô tô', subtitle: 'Mua bán ô tô cũ và mới, xe bán tải, xe điện',
  tabs: [{ slug: 'o-to', name: 'Ô tô' }, { slug: 'xe-ban-tai', name: 'Bán tải' }, { slug: 'xe-tai', name: 'Xe tải' }, { slug: 'xe-khach', name: 'Xe khách' }],
  filters: () => [
    { kind: 'range', key: 'year', label: 'Năm sản xuất', placeholder: ['Từ năm', 'Đến năm'] },
    { kind: 'max', key: 'mileage', label: 'Số km tối đa', unit: 'km', placeholder: 'Tối đa (km)' },
    { kind: 'select', key: 'fuel', label: 'Nhiên liệu', options: ['Xăng', 'Dầu', 'Hybrid', 'Điện'] },
    { kind: 'select', key: 'transmission', label: 'Hộp số', options: ['Số tự động', 'Số sàn', 'Bán tự động'] },
    { kind: 'select', key: 'body_type', label: 'Kiểu dáng', options: ['Sedan', 'SUV', 'Hatchback', 'Crossover', 'MPV', 'Bán tải', 'Coupe', 'Van'] },
    { kind: 'min', key: 'seats', label: 'Số chỗ', options: [4, 5, 7], suffix: '+' },
  ],
  highlight: () => [{ key: 'year', label: '' }, { key: 'mileage', label: '', unit: 'km' }, { key: 'transmission', label: '' }, { key: 'fuel', label: '' }],
};

/** Trả góp kiểu niên kim (chia đều gốc + lãi trên dư nợ giảm dần); rate là %/năm. */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): { monthly: number; totalInterest: number; total: number } {
  const n = Math.round(years * 12);
  if (!(principal > 0) || n <= 0) return { monthly: 0, totalInterest: 0, total: 0 };
  const r = annualRatePct / 100 / 12;
  const monthly = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
  return { monthly, totalInterest: monthly * n - principal, total: monthly * n };
}

/** Chi phí lăn bánh ước tính cho ô tô (người dùng chỉnh được từng khoản). */
export function rollingCost(price: number, o: { registrationPct: number; plateFee: number; otherFees: number }) {
  const registration = Math.round((price * o.registrationPct) / 100);
  return { registration, plateFee: o.plateFee, otherFees: o.otherFees, total: price + registration + o.plateFee + o.otherFees };
}
export const vnd = (n: number) => Math.round(n).toLocaleString('vi-VN') + '\u00a0đ';
export const vndShort = (n: number) => n >= 1e9 ? `${(n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ` : n >= 1e6 ? `${(n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu` : vnd(n);
