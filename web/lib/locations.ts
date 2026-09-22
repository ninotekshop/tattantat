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

export const ALL_PROVINCES: LocationNode[] = [
  {
    id: 'binh-dinh',
    code: '77',
    name: 'Bình Định',
    slug: 'binh-dinh',
    type: 'province',
    latitude: 13.782,
    longitude: 109.219,
    children: [
      { id: 'quy-nhon', code: '770', name: 'TP. Quy Nhơn', slug: 'quy-nhon', type: 'district', parentId: 'binh-dinh' },
      { id: 'an-nhon', code: '771', name: 'Thị xã An Nhơn', slug: 'an-nhon', type: 'district', parentId: 'binh-dinh' },
      { id: 'hoai-nhon', code: '772', name: 'Thị xã Hoài Nhơn', slug: 'hoai-nhon', type: 'district', parentId: 'binh-dinh' },
      { id: 'tuy-phuoc', code: '773', name: 'Huyện Tuy Phước', slug: 'tuy-phuoc', type: 'district', parentId: 'binh-dinh' },
      { id: 'phu-cat', code: '774', name: 'Huyện Phù Cát', slug: 'phu-cat', type: 'district', parentId: 'binh-dinh' },
      { id: 'phu-my', code: '775', name: 'Huyện Phù Mỹ', slug: 'phu-my', type: 'district', parentId: 'binh-dinh' },
      { id: 'tay-son', code: '776', name: 'Huyện Tây Sơn', slug: 'tay-son', type: 'district', parentId: 'binh-dinh' },
      { id: 'vinh-thanh', code: '777', name: 'Huyện Vĩnh Thạnh', slug: 'vinh-thanh', type: 'district', parentId: 'binh-dinh' },
      { id: 'van-canh', code: '778', name: 'Huyện Vân Canh', slug: 'van-canh', type: 'district', parentId: 'binh-dinh' },
      { id: 'an-lao', code: '779', name: 'Huyện An Lão', slug: 'an-lao', type: 'district', parentId: 'binh-dinh' },
      { id: 'hoai-an', code: '780', name: 'Huyện Hoài Ân', slug: 'hoai-an', type: 'district', parentId: 'binh-dinh' },
    ]
  },
  {
    id: 'hcm',
    code: '79',
    name: 'TP. Hồ Chí Minh',
    slug: 'tp-ho-chi-minh',
    type: 'city',
    latitude: 10.823,
    longitude: 106.629,
    children: [
      { id: 'quan-1', code: '760', name: 'Quận 1', slug: 'quan-1', type: 'district', parentId: 'hcm' },
      { id: 'quan-3', code: '761', name: 'Quận 3', slug: 'quan-3', type: 'district', parentId: 'hcm' },
      { id: 'quan-7', code: '762', name: 'Quận 7', slug: 'quan-7', type: 'district', parentId: 'hcm' },
      { id: 'quan-10', code: '763', name: 'Quận 10', slug: 'quan-10', type: 'district', parentId: 'hcm' },
      { id: 'quan-binh-thanh', code: '764', name: 'Quận Bình Thạnh', slug: 'quan-binh-thanh', type: 'district', parentId: 'hcm' },
      { id: 'quan-tan-binh', code: '765', name: 'Quận Tân Bình', slug: 'quan-tan-binh', type: 'district', parentId: 'hcm' },
      { id: 'tp-thu-duc', code: '766', name: 'TP. Thủ Đức', slug: 'tp-thu-duc', type: 'district', parentId: 'hcm' },
    ]
  },
  {
    id: 'ha-noi',
    code: '01',
    name: 'Hà Nội',
    slug: 'ha-noi',
    type: 'city',
    latitude: 21.028,
    longitude: 105.834,
    children: [
      { id: 'ba-dinh', code: '001', name: 'Quận Ba Đình', slug: 'ba-dinh', type: 'district', parentId: 'ha-noi' },
      { id: 'hoan-kiem', code: '002', name: 'Quận Hoàn Kiếm', slug: 'hoan-kiem', type: 'district', parentId: 'ha-noi' },
      { id: 'cau-giay', code: '003', name: 'Quận Cầu Giấy', slug: 'cau-giay', type: 'district', parentId: 'ha-noi' },
      { id: 'dong-da', code: '004', name: 'Quận Đống Đa', slug: 'dong-da', type: 'district', parentId: 'ha-noi' },
      { id: 'hai-ba-trung', code: '005', name: 'Quận Hai Bà Trưng', slug: 'hai-ba-trung', type: 'district', parentId: 'ha-noi' },
      { id: 'nam-tu-liem', code: '006', name: 'Quận Nam Từ Liêm', slug: 'nam-tu-liem', type: 'district', parentId: 'ha-noi' },
    ]
  },
  {
    id: 'da-nang',
    code: '48',
    name: 'Đà Nẵng',
    slug: 'da-nang',
    type: 'city',
    latitude: 16.054,
    longitude: 108.202,
    children: [
      { id: 'hai-chau', code: '490', name: 'Quận Hải Châu', slug: 'hai-chau', type: 'district', parentId: 'da-nang' },
      { id: 'thanh-khe', code: '491', name: 'Quận Thanh Khê', slug: 'thanh-khe', type: 'district', parentId: 'da-nang' },
      { id: 'sieu-tra', code: '492', name: 'Quận Sơn Trà', slug: 'son-tra', type: 'district', parentId: 'da-nang' },
      { id: 'ngu-hanh-son', code: '493', name: 'Quận Ngũ Hành Sơn', slug: 'ngu-hanh-son', type: 'district', parentId: 'da-nang' },
    ]
  },
  { id: 'an-giang', code: '89', name: 'An Giang', slug: 'an-giang', type: 'province' },
  { id: 'ba-ria-vung-tau', code: '77', name: 'Bà Rịa - Vũng Tàu', slug: 'ba-ria-vung-tau', type: 'province' },
  { id: 'bac-giang', code: '24', name: 'Bắc Giang', slug: 'bac-giang', type: 'province' },
  { id: 'bac-kan', code: '06', name: 'Bắc Kạn', slug: 'bac-kan', type: 'province' },
  { id: 'bac-lieu', code: '95', name: 'Bạc Liêu', slug: 'bac-lieu', type: 'province' },
  { id: 'bac-ninh', code: '27', name: 'Bắc Ninh', slug: 'bac-ninh', type: 'province' },
  { id: 'ben-tre', code: '83', name: 'Bến Tre', slug: 'ben-tre', type: 'province' },
  { id: 'binh-duong', code: '74', name: 'Bình Dương', slug: 'binh-duong', type: 'province' },
  { id: 'binh-phuoc', code: '70', name: 'Bình Phước', slug: 'binh-phuoc', type: 'province' },
  { id: 'binh-thuan', code: '60', name: 'Bình Thuận', slug: 'binh-thuan', type: 'province' },
  { id: 'ca-mau', code: '96', name: 'Cà Mau', slug: 'ca-mau', type: 'province' },
  { id: 'can-tho', code: '92', name: 'Cần Thơ', slug: 'can-tho', type: 'city' },
  { id: 'cao-bang', code: '04', name: 'Cao Bằng', slug: 'cao-bang', type: 'province' },
  { id: 'dak-lak', code: '66', name: 'Đắk Lắk', slug: 'dak-lak', type: 'province' },
  { id: 'dak-nong', code: '67', name: 'Đắk Nông', slug: 'dak-nong', type: 'province' },
  { id: 'dien-bien', code: '11', name: 'Điện Biên', slug: 'dien-bien', type: 'province' },
  { id: 'dong-nai', code: '75', name: 'Đồng Nai', slug: 'dong-nai', type: 'province' },
  { id: 'dong-thap', code: '87', name: 'Đồng Tháp', slug: 'dong-thap', type: 'province' },
  { id: 'gia-lai', code: '64', name: 'Gia Lai', slug: 'gia-lai', type: 'province' },
  { id: 'ha-giang', code: '02', name: 'Hà Giang', slug: 'ha-giang', type: 'province' },
  { id: 'ha-nam', code: '35', name: 'Hà Nam', slug: 'ha-nam', type: 'province' },
  { id: 'ha-tinh', code: '42', name: 'Hà Tĩnh', slug: 'ha-tinh', type: 'province' },
  { id: 'hai-duong', code: '30', name: 'Hải Dương', slug: 'hai-duong', type: 'province' },
  { id: 'hai-phong', code: '31', name: 'Hải Phòng', slug: 'hai-phong', type: 'city' },
  { id: 'hau-giang', code: '93', name: 'Hậu Giang', slug: 'hau-giang', type: 'province' },
  { id: 'hoa-binh', code: '17', name: 'Hòa Bình', slug: 'hoa-binh', type: 'province' },
  { id: 'hung-yen', code: '33', name: 'Hưng Yên', slug: 'hung-yen', type: 'province' },
  { id: 'khanh-hoa', code: '56', name: 'Khánh Hòa', slug: 'khanh-hoa', type: 'province' },
  { id: 'kien-giang', code: '91', name: 'Kiên Giang', slug: 'kien-giang', type: 'province' },
  { id: 'kon-tum', code: '62', name: 'Kon Tum', slug: 'kon-tum', type: 'province' },
  { id: 'lai-chau', code: '12', name: 'Lai Châu', slug: 'lai-chau', type: 'province' },
  { id: 'lam-dong', code: '68', name: 'Lâm Đồng', slug: 'lam-dong', type: 'province' },
  { id: 'lang-son', code: '20', name: 'Lạng Sơn', slug: 'lang-son', type: 'province' },
  { id: 'lao-cai', code: '10', name: 'Lào Cai', slug: 'lao-cai', type: 'province' },
  { id: 'long-an', code: '80', name: 'Long An', slug: 'long-an', type: 'province' },
  { id: 'nam-dinh', code: '36', name: 'Nam Định', slug: 'nam-dinh', type: 'province' },
  { id: 'nghe-an', code: '40', name: 'Nghệ An', slug: 'nghe-an', type: 'province' },
  { id: 'ninh-binh', code: '37', name: 'Ninh Bình', slug: 'ninh-binh', type: 'province' },
  { id: 'ninh-thuan', code: '58', name: 'Ninh Thuận', slug: 'ninh-thuan', type: 'province' },
  { id: 'phu-tho', code: '25', name: 'Phú Thọ', slug: 'phu-tho', type: 'province' },
  { id: 'phu-yen', code: '54', name: 'Phú Yên', slug: 'phu-yen', type: 'province' },
  { id: 'quang-binh', code: '44', name: 'Quảng Bình', slug: 'quang-binh', type: 'province' },
  { id: 'quang-nam', code: '49', name: 'Quảng Nam', slug: 'quang-nam', type: 'province' },
  { id: 'quang-ngai', code: '51', name: 'Quảng Ngãi', slug: 'quang-ngai', type: 'province' },
  { id: 'quang-ninh', code: '22', name: 'Quảng Ninh', slug: 'quang-ninh', type: 'province' },
  { id: 'quang-tri', code: '45', name: 'Quảng Trị', slug: 'quang-tri', type: 'province' },
  { id: 'soc-trang', code: '94', name: 'Sóc Trăng', slug: 'soc-trang', type: 'province' },
  { id: 'son-la', code: '14', name: 'Sơn La', slug: 'son-la', type: 'province' },
  { id: 'tay-ninh', code: '72', name: 'Tây Ninh', slug: 'tay-ninh', type: 'province' },
  { id: 'thai-binh', code: '34', name: 'Thái Bình', slug: 'thai-binh', type: 'province' },
  { id: 'thai-nguyen', code: '19', name: 'Thái Nguyên', slug: 'thai-nguyen', type: 'province' },
  { id: 'thanh-hoa', code: '38', name: 'Thanh Hóa', slug: 'thanh-hoa', type: 'province' },
  { id: 'thua-thien-hue', code: '46', name: 'Thừa Thiên Huế', slug: 'thua-thien-hue', type: 'province' },
  { id: 'tien-giang', code: '82', name: 'Tiền Giang', slug: 'tien-giang', type: 'province' },
  { id: 'tra-vinh', code: '84', name: 'Trà Vinh', slug: 'tra-vinh', type: 'province' },
  { id: 'tuyen-quang', code: '08', name: 'Tuyên Quang', slug: 'tuyen-quang', type: 'province' },
  { id: 'vinh-long', code: '86', name: 'Vĩnh Long', slug: 'vinh-long', type: 'province' },
  { id: 'vinh-phuc', code: '26', name: 'Vĩnh Phúc', slug: 'vinh-phuc', type: 'province' },
  { id: 'yen-bai', code: '15', name: 'Yên Bái', slug: 'yen-bai', type: 'province' }
];

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
