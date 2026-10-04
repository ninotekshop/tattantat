import { CATALOG, LEGACY_ELECTRONICS } from './listing-catalog';
import { Template, ListingData, validateTemplate, validateListing, looksLikeStreetAddress } from './listing-domain';

const leaf = (group: string, slug: string): Template => {
  const g = CATALOG.find(x => x.slug === group)!;
  const c = g.children.find(x => x.slug === slug)!;
  return { id: 't', categoryId: '1', version: 1, name: c.name, fields: c.fields, config: { ...g.config, ...c.config } };
};
const base = (extra: Partial<ListingData> = {}): ListingData => ({
  title: 'Tin thử nghiệm', description: 'Mô tả chi tiết cho tin đăng thử nghiệm', condition: 'USED_GOOD', priceMode: 'FIXED', price: '5000000',
  location: { province: 'Bình Định', ward: 'Ghềnh Ráng' }, contact: { name: 'Người bán', phone: '0912345678' },
  images: ['3b241101-e2bb-4255-8caf-4136c566a962'], values: {}, ...extra,
});
const keys = (t: Template) => t.fields.map(f => f.key);

describe('Danh mục & biểu mẫu theo chuyên mục', () => {
  it('mọi biểu mẫu đều hợp lệ theo validateTemplate', () => {
    for (const g of CATALOG) for (const item of [g, ...g.children]) {
      const config = 'config' in item && 'children' in item ? item.config : { ...g.config, ...(item as any).config };
      expect({ name: item.name, error: validateTemplate({ name: item.name, fields: item.fields, config }) }).toEqual({ name: item.name, error: null });
    }
    expect(validateTemplate({ name: LEGACY_ELECTRONICS.name, fields: LEGACY_ELECTRONICS.fields, config: LEGACY_ELECTRONICS.config })).toBeNull();
  });

  it('mỗi chuyên mục con có trường riêng, không trống', () => {
    for (const g of CATALOG) for (const c of g.children) expect({ slug: c.slug, n: c.fields.length > 0 }).toEqual({ slug: c.slug, n: true });
  });

  it.each([
    ['xe-co', 'o-to', ['year', 'mileage', 'transmission', 'fuel', 'seats']],
    ['xe-co', 'xe-may', ['engine', 'vehicle_type']],
    ['bat-dong-san', 'ban-nha', ['land_area', 'legal', 'bedrooms']],
    ['bat-dong-san', 'phong-tro', ['room_type', 'capacity', 'deposit']],
    ['bat-dong-san', 'can-ho', ['deal_type', 'apartment_type', 'floor_no']],
    ['do-cong-nghe', 'may-anh', ['camera_type', 'sensor', 'shutter_count']],
    ['do-cong-nghe', 'tv', ['screen_size', 'resolution', 'panel']],
    ['do-cong-nghe', 'dien-thoai', ['storage', 'battery_health', 'version']],
    ['thuc-pham', 'do-an', ['dish_type', 'preparation']],
    ['thuc-pham', 'dac-san', ['expiry', 'region']],
    ['thu-cung', 'thu-cung-canh', ['pet_type', 'breed', 'gender', 'age_months', 'vaccinated']],
    ['dich-vu', 'sua-chua', ['repair_type', 'service_area']],
    ['thoi-trang', 'giay-dep', ['shoe_type', 'shoe_size']],
    ['tang-mien-phi', 'thu-cung-cho-nuoi', ['reason', 'handover']],
    ['phan-mem-dich-vu-so', 'phan-mem-quan-ly-ban-hang', ['software_name', 'platform', 'license']],
    ['phan-mem-dich-vu-so', 'thiet-ke-website', ['web_type', 'delivery_days']],
  ])('%s > %s có trường đặc thù của chuyên mục', (group, slug, expected) => {
    for (const key of expected) expect(keys(leaf(group, slug))).toContain(key);
  });

  it('xe điện không yêu cầu dung tích động cơ (trường bị ẩn khi chạy điện)', () => {
    const t = leaf('xe-co', 'o-to');
    const values = { brand: 'VinFast', model: 'VF8', year: 2023, mileage: 1000, transmission: 'Số tự động', fuel: 'Điện', seats: 5 };
    expect(validateListing(base({ price: '900000000', values }), t, true)).toEqual({});
    expect(validateListing(base({ price: '900000000', values: { ...values, engine: 1500 } }), t, true)['values.engine']).toBeUndefined();
  });

  it('chuyên mục không có khái niệm mới/cũ không bắt chọn tình trạng', () => {
    const service = leaf('dich-vu', 'sua-chua');
    const data = base({ values: { repair_type: 'Điện nước', service_area: 'Quy Nhơn' } }); delete data.condition;
    expect(validateListing(data, service, true)).toEqual({});
    const tech = leaf('do-cong-nghe', 'tv');
    expect(validateListing({ ...data, values: { brand: 'Sony', model: 'X', screen_size: 55, resolution: '4K' } }, tech, true).condition).toBeDefined();
    const property = leaf('bat-dong-san', 'ban-nha');
    expect(property.config.condition).toBe('none');
  });

  it('giá phải đạt mức tối thiểu và không cho 0 đồng ở chế độ giá cố định', () => {
    const tech = leaf('do-cong-nghe', 'tv'); const values = { brand: 'Sony', model: 'X', screen_size: 55, resolution: '4K' };
    expect(validateListing(base({ price: '0', values }), tech, true).price).toBeDefined();
    expect(validateListing(base({ price: '999', values }), tech, true).price).toBeDefined();
    expect(validateListing(base({ price: '1000', values }), tech, true).price).toBeUndefined();
    expect(validateListing(base({ priceMode: 'FREE', price: '0', values }), tech, true).price).toBeUndefined();
    expect(validateListing(base({ priceMode: 'CONTACT', price: undefined, values }), tech, true).price).toBeUndefined();
    const car = leaf('xe-co', 'o-to');
    expect(validateListing(base({ price: '200000', values: { brand: 'a', model: 'b', year: 2020, mileage: 1, transmission: 'Số sàn', fuel: 'Xăng', seats: 5 } }), car, true).price).toBeDefined();
  });

  it('chế độ giá đúng với từng loại: nhà bán không tính theo tháng, phòng trọ chỉ theo tháng, ô tô không cho tặng', () => {
    expect(leaf('bat-dong-san', 'ban-nha').config.priceModes).toEqual(['FIXED', 'CONTACT']);
    expect(leaf('bat-dong-san', 'phong-tro').config.priceModes).toEqual(['MONTH', 'CONTACT']);
    expect(leaf('xe-co', 'o-to').config.priceModes).not.toContain('FREE');
    expect(leaf('tang-mien-phi', 'do-gia-dung-tang').config.priceModes).toEqual(['FREE']);
  });

  it('các trường số nguyên & giới hạn hợp lý', () => {
    const car = leaf('xe-co', 'o-to'); const ok = { brand: 'a', model: 'b', year: 2020, mileage: 10, transmission: 'Số sàn', fuel: 'Xăng', seats: 5 };
    const price = { price: '300000000' };
    expect(validateListing(base({ ...price, values: { ...ok, seats: 4.5 } }), car, true)['values.seats']).toBeDefined();
    expect(validateListing(base({ ...price, values: { ...ok, seats: 0 } }), car, true)['values.seats']).toBeDefined();
    expect(validateListing(base({ ...price, values: { ...ok, year: 1850 } }), car, true)['values.year']).toBeDefined();
    expect(validateListing(base({ ...price, values: { ...ok, mileage: -1 } }), car, true)['values.mileage']).toBeDefined();
  });

  it('pháp lý, hướng nhà là danh sách chọn chứ không phải ô nhập tự do', () => {
    const house = leaf('bat-dong-san', 'ban-nha');
    for (const key of ['legal', 'direction', 'property_type']) expect(house.fields.find(f => f.key === key)!.type).toBe('select');
    const land = leaf('bat-dong-san', 'ban-dat');
    for (const key of ['legal', 'land_type', 'direction']) expect(land.fields.find(f => f.key === key)!.type).toBe('select');
    const values = { property_type: 'Nhà riêng', land_area: 80, legal: 'tự do gõ' };
    expect(validateListing(base({ price: '2000000000', values }), house, true)['values.legal']).toBeDefined();
  });
});

describe('Nhận diện địa chỉ trong mô tả', () => {
  it.each([
    'Nhà số nhà 45 gần biển', 'Địa chỉ 123 đường Nguyễn Huệ, Quy Nhơn', 'Hẻm 12 Lê Lợi', 'ngõ 5 Trần Phú', '45/12 phố Hàng Bông', 'sn 12 khu phố 3',
  ])('chặn địa chỉ chi tiết: %s', text => expect(looksLikeStreetAddress(text)).toBe(true));
  it.each([
    'Nhà gần đường lớn, thuận tiện đi lại', 'Căn hộ có số 2 phòng ngủ và 2 WC', 'Đường trước nhà rộng 8m, 3 tầng', 'Phường Ghềnh Ráng yên tĩnh', 'Cách quận trung tâm 5 phút', 'Xe đời 2020, số tự động',
  ])('cho phép mô tả chung: %s', text => expect(looksLikeStreetAddress(text)).toBe(false));
});
