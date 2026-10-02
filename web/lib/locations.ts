import { VN_ADMIN } from './vn-admin-data';

export interface LocationNode {
  id: string;
  code: string;
  name: string;
  slug: string;
  type: 'province' | 'city' | 'district' | 'ward';
  parentId?: string | null;
  popular?: boolean;
  latitude?: number;
  longitude?: number;
  children?: LocationNode[];
}

export type LocationSelectionMode = 'nationwide' | 'administrative' | 'nearby';

export interface LocationSelection {
  mode: LocationSelectionMode;
  locationId?: string | null;
  provinceName?: string | null;
  districtName?: string | null;
  wardName?: string | null;
  label: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number;
}

export function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

export const POPULAR_LOCATIONS: LocationNode[] = [
  { id: 'binh-dinh', code: '77', name: 'Bình Định (Quy Nhơn)', slug: 'binh-dinh', type: 'province', popular: true, latitude: 13.782, longitude: 109.219 },
  { id: 'hcm', code: '79', name: 'TP. Hồ Chí Minh', slug: 'tp-ho-chi-minh', type: 'city', popular: true, latitude: 10.823, longitude: 106.629 },
  { id: 'ha-noi', code: '01', name: 'Hà Nội', slug: 'ha-noi', type: 'city', popular: true, latitude: 21.028, longitude: 105.834 },
  { id: 'da-nang', code: '48', name: 'Đà Nẵng', slug: 'da-nang', type: 'city', popular: true, latitude: 16.054, longitude: 108.202 },
  { id: 'can-tho', code: '92', name: 'Cần Thơ', slug: 'can-tho', type: 'city', popular: true, latitude: 10.045, longitude: 105.746 },
  { id: 'khanh-hoa', code: '56', name: 'Khánh Hòa (Nha Trang)', slug: 'khanh-hoa', type: 'province', popular: true, latitude: 12.238, longitude: 109.196 },
  { id: 'lam-dong', code: '68', name: 'Lâm Đồng (Đà Lạt)', slug: 'lam-dong', type: 'province', popular: true, latitude: 11.94, longitude: 108.458 },
  { id: 'hai-phong', code: '31', name: 'Hải Phòng', slug: 'hai-phong', type: 'city', popular: true, latitude: 20.844, longitude: 106.688 },
  { id: 'binh-duong', code: '74', name: 'Bình Dương', slug: 'binh-duong', type: 'province', popular: true, latitude: 11.085, longitude: 106.657 },
  { id: 'dong-nai', code: '75', name: 'Đồng Nai', slug: 'dong-nai', type: 'province', popular: true, latitude: 10.957, longitude: 106.842 },
  { id: 'quang-nam', code: '49', name: 'Quảng Nam', slug: 'quang-nam', type: 'province', popular: true, latitude: 15.568, longitude: 108.48 },
  { id: 'gia-lai', code: '64', name: 'Gia Lai', slug: 'gia-lai', type: 'province', popular: true, latitude: 13.983, longitude: 108.0 },
];

// Toàn bộ 63 tỉnh/thành và quận/huyện (đơn vị hành chính cũ), dùng chung cho form tìm kiếm và form đăng ký/đăng tin.
export const ALL_PROVINCES: LocationNode[] = VN_ADMIN.map(([code, id, name, districts]) => {
  const popular = POPULAR_LOCATIONS.find(p => p.id === id);
  return {
    id,
    code,
    name,
    slug: id,
    type: (popular?.type ?? 'province') as 'province' | 'city',
    ...(popular?.latitude !== undefined ? { latitude: popular.latitude, longitude: popular.longitude } : {}),
    children: districts.map(([dcode, dname]) => ({
      id: `${id}-${dcode}`,
      code: dcode,
      name: dname,
      slug: removeAccents(dname).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      type: 'district' as const,
      parentId: id,
    })),
  };
}).sort((a, b) => a.name.localeCompare(b.name, 'vi'));


export function searchLocations(query: string): LocationNode[] {
  const normalized = removeAccents(query);
  if (!normalized) return ALL_PROVINCES;

  const matches: LocationNode[] = [];
  for (const prov of ALL_PROVINCES) {
    const provNameNorm = removeAccents(prov.name);
    if (provNameNorm.includes(normalized)) {
      matches.push(prov);
      continue;
    }
    if (prov.children) {
      const matchedChildren = prov.children.filter(child => removeAccents(child.name).includes(normalized));
      if (matchedChildren.length > 0) {
        matches.push({
          ...prov,
          children: matchedChildren
        });
      }
    }
  }
  return matches;
}
