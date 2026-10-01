import type { Field, FieldType, Template } from './listing-domain';

/**
 * Danh mục & biểu mẫu đăng tin theo từng chuyên mục (nguồn dữ liệu duy nhất).
 * Mỗi chuyên mục lá có bộ trường riêng; CatalogSyncService đồng bộ vào bảng categories / listing_templates.
 */
type Cfg = Field['config'];
export type TemplateConfig = Template['config'];
export type LeafSpec = { slug: string; name: string; fields: Field[]; config?: Partial<TemplateConfig> };
export type GroupSpec = { slug: string; name: string; order: number; config: TemplateConfig; fields: Field[]; children: LeafSpec[] };

const mk = (type: FieldType, key: string, label: string, required: boolean, config: Cfg = {}, options: string[] = []): Field =>
  ({ key, label, type, required, enabled: true, options: options.map(value => ({ value, label: value })), config });
const t = (key: string, label: string, req = false, cfg: Cfg = {}) => mk('text', key, label, req, { maxLength: 150, ...cfg });
const ta = (key: string, label: string, req = false, cfg: Cfg = {}) => mk('textarea', key, label, req, { maxLength: 2000, ...cfg });
const n = (key: string, label: string, req = false, cfg: Cfg = {}) => mk('number', key, label, req, { min: 0, ...cfg });
const s = (key: string, label: string, req: boolean, options: string[], cfg: Cfg = {}) => mk('select', key, label, req, cfg, options);
const ms = (key: string, label: string, options: string[], cfg: Cfg = {}) => mk('multi-select', key, label, false, cfg, options);
const b = (key: string, label: string, cfg: Cfg = {}) => mk('boolean', key, label, false, cfg);
const d = (key: string, label: string, req = false, cfg: Cfg = {}) => mk('date', key, label, req, cfg);
const y = (key: string, label: string, req = false, min = 1950) => mk('year', key, label, req, { min });
const money = (key: string, label: string, req = false, cfg: Cfg = {}) => mk('currency', key, label, req, { min: 0, unit: 'đ', ...cfg });

// ---- Danh sách dùng chung ----
const COUNTRIES = ['Việt Nam', 'Nhật Bản', 'Hàn Quốc', 'Trung Quốc', 'Thái Lan', 'Mỹ', 'Đức', 'Ý', 'Pháp', 'Anh', 'Đài Loan', 'Khác'];
const origin = (label = 'Xuất xứ') => s('origin', label, false, COUNTRIES);
const warranty = () => s('warranty', 'Bảo hành', false, ['Còn bảo hành hãng', 'Còn bảo hành cửa hàng', 'Hết bảo hành', 'Không bảo hành']);
const color = () => t('color', 'Màu sắc', false, { maxLength: 60 });
const RAM = ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB', '18 GB', '24 GB', '32 GB', '64 GB'];
const STORAGE = ['16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB'];
const DIRECTIONS = ['Đông', 'Tây', 'Nam', 'Bắc', 'Đông Bắc', 'Đông Nam', 'Tây Bắc', 'Tây Nam'];
const LEGAL = ['Sổ đỏ / Sổ hồng', 'Hợp đồng mua bán', 'Giấy tờ viết tay', 'Đang chờ cấp sổ', 'Khác'];
const FURNISHED = ['Không nội thất', 'Nội thất cơ bản', 'Đầy đủ nội thất'];
const AUDIENCE = ['Nam', 'Nữ', 'Trẻ em', 'Unisex'];
const AUTHENTIC = ['Chính hãng (có hóa đơn)', 'Chính hãng (không hóa đơn)', 'Hàng không thương hiệu / Không xác định'];
const PET_TYPES = ['Chó', 'Mèo', 'Chim', 'Cá cảnh', 'Hamster / Thú nhỏ', 'Thỏ', 'Bò sát', 'Khác'];
const FORPET = ['Chó', 'Mèo', 'Chim', 'Cá', 'Thú nhỏ', 'Nhiều loại'];
const HANDOVER = ['Tự đến lấy', 'Có thể giao tận nơi'];
const STORAGE_FOOD = ['Nhiệt độ thường', 'Bảo quản lạnh', 'Đông lạnh'];
const UNITS_FOOD = ['Gam', 'Kg', 'Lít', 'Hộp', 'Gói', 'Chai', 'Khay', 'Phần'];

const F = { t, ta, n, s, ms, b, d, y, money, origin, warranty, color };
export { F };

// ============================ ĐỒ CÔNG NGHỆ ============================
const techGeneric: Field[] = [t('brand', 'Thương hiệu', true), t('model', 'Model'), origin(), warranty()];
const TECH: LeafSpec[] = [
  { slug: 'dien-thoai', name: 'Điện thoại', config: { maxPrice: 200_000_000 }, fields: [
    s('brand', 'Hãng', true, ['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Huawei', 'Honor', 'Nokia', 'Sony', 'Google', 'Asus', 'Khác']),
    t('model', 'Dòng máy (Model)', true, { placeholder: 'VD: iPhone 15 Pro Max' }),
    s('storage', 'Bộ nhớ trong', true, STORAGE), s('ram', 'RAM', false, RAM), color(),
    s('version', 'Phiên bản', false, ['Chính hãng Việt Nam (VN/A)', 'Quốc tế', 'Xách tay', 'Khác']),
    n('screen', 'Kích thước màn hình', false, { min: 3, max: 10, unit: 'inch' }),
    t('camera', 'Camera', false, { placeholder: 'VD: 48MP + 12MP + 12MP' }),
    n('battery', 'Dung lượng pin', false, { min: 500, max: 10000, unit: 'mAh', integer: true }),
    n('battery_health', 'Sức khỏe pin', false, { min: 1, max: 100, unit: '%', integer: true }),
    s('sim', 'SIM', false, ['1 SIM', '2 SIM', 'eSIM', '1 SIM + eSIM']), b('five_g', 'Hỗ trợ 5G'),
    s('os', 'Hệ điều hành', false, ['iOS', 'Android', 'Khác']),
    ms('accessories', 'Phụ kiện đi kèm', ['Hộp máy', 'Sạc', 'Cáp', 'Tai nghe', 'Ốp lưng', 'Hóa đơn / Phiếu bảo hành']),
    origin(), warranty(),
  ] },
  { slug: 'laptop', name: 'Laptop', config: { maxPrice: 500_000_000 }, fields: [
    s('brand', 'Hãng', true, ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Microsoft', 'LG', 'Gigabyte', 'Khác']),
    t('model', 'Dòng máy (Model)', true, { placeholder: 'VD: MacBook Air M2 13 inch' }),
    t('cpu', 'CPU', true, { placeholder: 'VD: Core i7-1260P / Apple M2' }),
    s('ram', 'RAM', true, RAM),
    s('storage', 'Dung lượng ổ cứng', true, ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB', 'Trên 2 TB']),
    s('storage_type', 'Loại ổ cứng', false, ['SSD', 'HDD', 'SSD + HDD']),
    t('gpu', 'Card đồ họa (GPU)'), n('screen', 'Kích thước màn hình', false, { min: 10, max: 20, unit: 'inch' }),
    s('resolution', 'Độ phân giải', false, ['HD', 'Full HD', '2K', '2.5K', '3K', '4K', 'Retina']),
    s('os', 'Hệ điều hành', false, ['macOS', 'Windows', 'Linux', 'Không có HĐH']),
    n('battery_health', 'Sức khỏe pin', false, { min: 1, max: 100, unit: '%', integer: true }),
    y('purchase_year', 'Năm mua', false, 2005),
    ms('accessories', 'Phụ kiện đi kèm', ['Sạc', 'Hộp máy', 'Túi / Balo', 'Chuột', 'Hóa đơn / Phiếu bảo hành']), warranty(),
  ] },
  { slug: 'may-tinh-bang', name: 'Máy tính bảng', config: { maxPrice: 200_000_000 }, fields: [
    s('brand', 'Hãng', true, ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Lenovo', 'Microsoft', 'Amazon', 'Khác']),
    t('model', 'Dòng máy (Model)', true), s('storage', 'Bộ nhớ trong', true, STORAGE), s('ram', 'RAM', false, RAM),
    n('screen', 'Kích thước màn hình', false, { min: 5, max: 15, unit: 'inch' }),
    s('connectivity', 'Kết nối', false, ['Chỉ Wi-Fi', 'Wi-Fi + 4G/5G']), s('os', 'Hệ điều hành', false, ['iPadOS', 'Android', 'Windows', 'Khác']),
    n('battery_health', 'Sức khỏe pin', false, { min: 1, max: 100, unit: '%', integer: true }), color(),
    ms('accessories', 'Phụ kiện đi kèm', ['Bút cảm ứng', 'Bàn phím', 'Ốp / Bao da', 'Sạc', 'Hộp máy']), origin(), warranty(),
  ] },
  { slug: 'may-tinh-de-ban', name: 'Máy tính để bàn', fields: [
    s('pc_type', 'Loại máy', true, ['PC lắp ráp', 'PC thương hiệu', 'All-in-one', 'Mini PC', 'Workstation']),
    t('brand', 'Hãng / Thương hiệu'), t('cpu', 'CPU', true), s('ram', 'RAM', true, RAM),
    s('storage', 'Dung lượng ổ cứng', true, ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB', 'Trên 2 TB']),
    s('storage_type', 'Loại ổ cứng', false, ['SSD', 'HDD', 'SSD + HDD']), t('gpu', 'Card đồ họa (GPU)'),
    b('monitor_included', 'Kèm màn hình'), n('screen', 'Kích thước màn hình', false, { min: 15, max: 49, unit: 'inch' }),
    s('os', 'Hệ điều hành', false, ['Windows', 'macOS', 'Linux', 'Không có HĐH']), warranty(),
  ] },
  { slug: 'may-anh', name: 'Máy ảnh', config: { maxPrice: 2_000_000_000 }, fields: [
    s('camera_type', 'Loại máy', true, ['DSLR', 'Mirrorless', 'Compact', 'Máy ảnh phim', 'Instant', 'Action cam', 'Khác']),
    s('brand', 'Hãng', true, ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic', 'Olympus / OM System', 'Leica', 'Pentax', 'GoPro', 'DJI', 'Khác']),
    t('model', 'Dòng máy (Model)', true, { placeholder: 'VD: Canon EOS R6 Mark II' }),
    s('sensor', 'Cảm biến', false, ['Full-frame', 'APS-C', 'Micro 4/3', '1 inch', 'Medium format', 'Khác']),
    n('megapixels', 'Độ phân giải', false, { min: 1, max: 200, unit: 'MP' }),
    n('shutter_count', 'Số lần chụp (shutter count)', false, { min: 0, max: 5_000_000, integer: true, help: 'Xem bằng phần mềm đọc shutter count của hãng.' }),
    s('lens_included', 'Ống kính đi kèm', false, ['Chỉ thân máy (body)', 'Kèm lens kit', 'Kèm nhiều ống kính']),
    t('lens_info', 'Thông tin ống kính', false, { placeholder: 'VD: RF 24-105mm f/4' }),
    ms('accessories', 'Phụ kiện đi kèm', ['Pin', 'Sạc', 'Thẻ nhớ', 'Dây đeo', 'Túi máy ảnh', 'Hộp máy', 'Hóa đơn / Phiếu bảo hành']), warranty(),
  ] },
  { slug: 'may-quay', name: 'Máy quay', fields: [
    s('camcorder_type', 'Loại máy', true, ['Camcorder', 'Cinema camera', 'Action cam', 'Flycam / Drone', 'Webcam / Camera livestream', 'Khác']),
    t('brand', 'Hãng', true), t('model', 'Dòng máy (Model)', true),
    s('video_res', 'Quay video tối đa', false, ['Full HD', '2.7K', '4K', '5.3K', '6K', '8K']),
    b('stabilization', 'Có chống rung'), n('battery_count', 'Số pin đi kèm', false, { min: 0, max: 20, integer: true }),
    ms('accessories', 'Phụ kiện đi kèm', ['Pin', 'Sạc', 'Thẻ nhớ', 'Tripod / Gimbal', 'Mic', 'Túi / Hộp']), warranty(),
  ] },
  { slug: 'tv', name: 'TV', config: { maxPrice: 500_000_000 }, fields: [
    t('brand', 'Hãng', true), t('model', 'Model', true),
    n('screen_size', 'Kích thước màn hình', true, { min: 10, max: 120, unit: 'inch', integer: true }),
    s('resolution', 'Độ phân giải', true, ['HD', 'Full HD', '4K', '8K']),
    s('panel', 'Loại màn hình', false, ['LED', 'QLED', 'OLED', 'Mini LED', 'LCD', 'Khác']), b('smart', 'Smart TV'),
    s('os', 'Hệ điều hành TV', false, ['Google TV / Android TV', 'webOS', 'Tizen', 'Roku', 'Khác']), y('year', 'Năm sản xuất', false, 2000),
    ms('accessories', 'Phụ kiện đi kèm', ['Điều khiển', 'Chân đế', 'Giá treo', 'Hộp máy']), warranty(),
  ] },
  { slug: 'thiet-bi-am-thanh', name: 'Thiết bị âm thanh', fields: [
    s('audio_type', 'Loại thiết bị', true, ['Loa bluetooth', 'Loa vi tính', 'Soundbar', 'Dàn karaoke', 'Amply', 'Micro', 'Tai nghe', 'Loa kéo', 'Khác']),
    t('brand', 'Hãng', true), t('model', 'Model'), n('power_w', 'Công suất', false, { min: 1, max: 100000, unit: 'W' }),
    ms('connectivity', 'Kết nối', ['Bluetooth', 'AUX 3.5mm', 'USB', 'HDMI', 'Optical', 'Wi-Fi']), warranty(),
  ] },
  { slug: 'phu-kien-cong-nghe', name: 'Phụ kiện công nghệ', fields: [
    s('accessory_type', 'Loại phụ kiện', true, ['Sạc / Củ sạc', 'Cáp', 'Pin dự phòng', 'Ốp lưng / Bao da', 'Chuột', 'Bàn phím', 'Tai nghe', 'Thẻ nhớ / USB', 'Ổ cứng', 'Hub / Đầu chuyển', 'Giá đỡ', 'Khác']),
    t('brand', 'Hãng'), t('compatible_with', 'Tương thích với', false, { placeholder: 'VD: iPhone 15, MacBook Air' }), origin(), warranty(),
  ] },
  { slug: 'may-choi-game', name: 'Máy chơi game', fields: [
    s('platform', 'Hệ máy', true, ['PlayStation', 'Xbox', 'Nintendo', 'Steam Deck / Handheld PC', 'Máy game retro', 'Khác']),
    t('model', 'Dòng máy (Model)', true), s('storage', 'Bộ nhớ', false, ['500 GB', '825 GB', '1 TB', '2 TB', 'Khác']),
    n('controllers', 'Số tay cầm đi kèm', false, { min: 0, max: 8, integer: true }), t('includes_games', 'Game đi kèm'),
    b('modded', 'Đã can thiệp phần mềm (jailbreak/mod)'), warranty(),
  ] },
  { slug: 'dong-ho-thong-minh', name: 'Đồng hồ thông minh', fields: [
    s('brand', 'Hãng', true, ['Apple', 'Samsung', 'Garmin', 'Xiaomi', 'Huawei', 'Amazfit', 'Fitbit', 'Khác']),
    t('model', 'Dòng máy (Model)', true), n('case_size', 'Kích thước mặt', false, { min: 20, max: 60, unit: 'mm' }),
    s('connectivity', 'Kết nối', false, ['GPS', 'GPS + Cellular']), n('battery_health', 'Sức khỏe pin', false, { min: 1, max: 100, unit: '%', integer: true }),
    s('strap_material', 'Chất liệu dây', false, ['Silicone / Cao su', 'Kim loại', 'Da', 'Vải', 'Khác']), color(), warranty(),
  ] },
];
export const TECH_GROUP: GroupSpec = { slug: 'do-cong-nghe', name: 'Đồ công nghệ', order: 0, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required', minPrice: 1000 }, fields: techGeneric, children: TECH };
export const LEGACY_ELECTRONICS = { slug: 'do-dien-tu', name: 'Đồ điện tử', fields: techGeneric, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required', minPrice: 1000 } as TemplateConfig };
// ============================ XE CỘ ============================
const ownerCount = () => n('owner_count', 'Số đời chủ', false, { min: 1, max: 20, integer: true });
const inspection = () => d('inspection', 'Hạn đăng kiểm');
const maintenance = () => ta('maintenance', 'Lịch sử bảo dưỡng');
const vehicleDocs = () => ms('documents', 'Giấy tờ xe', ['Cà vẹt / Đăng ký xe', 'Sổ bảo dưỡng', 'Chính chủ', 'Có hóa đơn mua xe']);
const TRANSMISSION = ['Số tự động', 'Số sàn', 'Bán tự động'];
const FUEL = ['Xăng', 'Dầu', 'Hybrid', 'Điện'];
const engineCc = () => n('engine', 'Dung tích động cơ', false, { min: 50, max: 8000, unit: 'cc', integer: true, visibleWhen: { field: 'fuel', operator: 'ne', value: 'Điện' } });
const VEHICLES: LeafSpec[] = [
  { slug: 'o-to', name: 'Ô tô', config: { priceModes: ['FIXED', 'DAY', 'MONTH', 'CONTACT'], minPrice: 300_000, maxPrice: 50_000_000_000 }, fields: [
    t('brand', 'Hãng xe', true, { placeholder: 'VD: Toyota, Mazda, VinFast' }), t('model', 'Dòng xe', true, { placeholder: 'VD: Vios, CX-5' }), t('variant', 'Phiên bản', false, { placeholder: 'VD: 1.5G CVT' }),
    y('year', 'Năm sản xuất', true, 1950),
    s('body_type', 'Kiểu dáng', false, ['Sedan', 'SUV', 'Hatchback', 'Crossover', 'MPV', 'Bán tải', 'Coupe', 'Convertible', 'Van', 'Khác']),
    n('mileage', 'Số km đã đi', true, { min: 0, max: 2_000_000, unit: 'km', integer: true }),
    s('transmission', 'Hộp số', true, TRANSMISSION), s('fuel', 'Nhiên liệu', true, FUEL), engineCc(),
    n('seats', 'Số chỗ ngồi', true, { min: 2, max: 9, integer: true }), color(), s('origin', 'Xuất xứ', false, ['Lắp ráp trong nước', 'Nhập khẩu']),
    ownerCount(), inspection(), d('insurance', 'Hạn bảo hiểm'), maintenance(), vehicleDocs(), warranty(),
  ] },
  { slug: 'xe-may', name: 'Xe máy', config: { priceModes: ['FIXED', 'DAY', 'MONTH', 'CONTACT'], minPrice: 50_000, maxPrice: 5_000_000_000 }, fields: [
    s('vehicle_type', 'Loại xe', true, ['Xe số', 'Xe tay ga', 'Xe côn tay', 'Mô tô phân khối lớn', 'Xe điện', 'Khác']),
    s('brand', 'Hãng xe', true, ['Honda', 'Yamaha', 'Suzuki', 'SYM', 'Piaggio', 'Vespa', 'VinFast', 'Kawasaki', 'Ducati', 'BMW', 'Harley-Davidson', 'Khác']),
    t('model', 'Dòng xe', true, { placeholder: 'VD: Vision, Exciter, SH' }), y('year', 'Năm sản xuất', true, 1970),
    n('engine', 'Dung tích xy-lanh', true, { min: 20, max: 2500, unit: 'cc', integer: true, visibleWhen: { field: 'vehicle_type', operator: 'ne', value: 'Xe điện' } }),
    n('mileage', 'Số km đã đi', false, { min: 0, max: 1_000_000, unit: 'km', integer: true }), color(),
    s('origin', 'Xuất xứ', false, ['Lắp ráp trong nước', 'Nhập khẩu']), ownerCount(), vehicleDocs(), maintenance(), warranty(),
  ] },
  { slug: 'xe-dien', name: 'Xe điện', config: { priceModes: ['FIXED', 'DAY', 'MONTH', 'CONTACT'], minPrice: 50_000, maxPrice: 3_000_000_000 }, fields: [
    s('ev_type', 'Loại xe điện', true, ['Xe máy điện', 'Xe đạp điện', 'Ô tô điện', 'Xe điện khác']), t('brand', 'Hãng xe', true), t('model', 'Dòng xe', true),
    y('year', 'Năm sản xuất', false, 2000), s('battery_type', 'Loại pin', false, ['Ắc quy chì', 'Lithium-ion', 'Khác']),
    n('battery_capacity', 'Dung lượng pin', false, { min: 1, max: 500, unit: 'Ah / kWh' }), n('range_km', 'Quãng đường mỗi lần sạc', false, { min: 1, max: 1000, unit: 'km' }),
    n('max_speed', 'Tốc độ tối đa', false, { min: 1, max: 300, unit: 'km/h' }), n('motor_power', 'Công suất động cơ', false, { min: 1, max: 100000, unit: 'W' }),
    n('mileage', 'Số km đã đi', false, { min: 0, max: 1_000_000, unit: 'km', integer: true }), color(), vehicleDocs(), warranty(),
  ] },
  { slug: 'xe-tai', name: 'Xe tải', config: { priceModes: ['FIXED', 'DAY', 'MONTH', 'CONTACT'], minPrice: 300_000, maxPrice: 20_000_000_000 }, fields: [
    t('brand', 'Hãng xe', true), t('model', 'Dòng xe', true), y('year', 'Năm sản xuất', true, 1970),
    n('payload_ton', 'Tải trọng', true, { min: 0.1, max: 100, unit: 'tấn' }),
    s('body_type', 'Loại thùng', true, ['Thùng kín', 'Thùng lửng', 'Thùng mui bạt', 'Xe ben', 'Đông lạnh', 'Xe bồn', 'Xe cẩu', 'Đầu kéo', 'Khác']),
    n('mileage', 'Số km đã đi', false, { min: 0, max: 5_000_000, unit: 'km', integer: true }), s('transmission', 'Hộp số', false, TRANSMISSION), s('fuel', 'Nhiên liệu', false, FUEL), engineCc(),
    n('seats', 'Số chỗ cabin', false, { min: 1, max: 9, integer: true }), inspection(), ownerCount(), maintenance(), vehicleDocs(),
  ] },
  { slug: 'xe-ban-tai', name: 'Xe bán tải', config: { priceModes: ['FIXED', 'DAY', 'MONTH', 'CONTACT'], minPrice: 300_000, maxPrice: 20_000_000_000 }, fields: [
    t('brand', 'Hãng xe', true), t('model', 'Dòng xe', true), t('variant', 'Phiên bản'), y('year', 'Năm sản xuất', true, 1990),
    n('mileage', 'Số km đã đi', true, { min: 0, max: 2_000_000, unit: 'km', integer: true }), s('transmission', 'Hộp số', true, TRANSMISSION), s('fuel', 'Nhiên liệu', true, ['Dầu', 'Xăng', 'Hybrid', 'Điện']),
    s('drive_type', 'Dẫn động', false, ['1 cầu (4x2)', '2 cầu (4x4)']), n('payload_kg', 'Tải trọng', false, { min: 100, max: 5000, unit: 'kg', integer: true }),
    n('seats', 'Số chỗ ngồi', false, { min: 2, max: 7, integer: true }), color(), inspection(), ownerCount(), maintenance(), vehicleDocs(),
  ] },
  { slug: 'xe-khach', name: 'Xe khách', config: { priceModes: ['FIXED', 'DAY', 'MONTH', 'CONTACT'], minPrice: 500_000, maxPrice: 20_000_000_000 }, fields: [
    t('brand', 'Hãng xe', true), t('model', 'Dòng xe', true), y('year', 'Năm sản xuất', true, 1970),
    n('seats', 'Số chỗ ngồi', true, { min: 9, max: 60, integer: true }), s('transmission', 'Hộp số', false, TRANSMISSION), s('fuel', 'Nhiên liệu', false, FUEL), engineCc(),
    n('mileage', 'Số km đã đi', false, { min: 0, max: 5_000_000, unit: 'km', integer: true }), inspection(), ownerCount(), maintenance(), vehicleDocs(),
  ] },
  { slug: 'xe-dap', name: 'Xe đạp', config: { priceModes: ['FIXED', 'DAY', 'MONTH', 'CONTACT'], minPrice: 20_000, maxPrice: 500_000_000 }, fields: [
    s('bike_type', 'Loại xe đạp', true, ['Địa hình (MTB)', 'Đua (Road)', 'Touring / Hybrid', 'Xe đạp gấp', 'Trẻ em', 'Thành phố / Cruiser', 'Trợ lực điện', 'Fixed gear', 'Khác']),
    t('brand', 'Hãng'), t('model', 'Model'), s('frame_size', 'Kích cỡ khung', false, ['XS', 'S', 'M', 'L', 'XL', 'Khác']),
    s('frame_material', 'Chất liệu khung', false, ['Nhôm', 'Carbon', 'Thép', 'Titan', 'Khác']),
    s('wheel_size', 'Cỡ bánh', false, ['12 inch', '16 inch', '20 inch', '24 inch', '26 inch', '27.5 inch', '29 inch', '700c']),
    n('gears', 'Số tốc độ (líp/đĩa)', false, { min: 1, max: 40, integer: true }), s('brake_type', 'Loại phanh', false, ['Phanh vành', 'Đĩa cơ', 'Đĩa dầu']), color(),
  ] },
  { slug: 'phu-tung-xe', name: 'Phụ tùng & đồ chơi xe', config: { minPrice: 1000 }, fields: [
    s('for_vehicle', 'Dùng cho', true, ['Ô tô', 'Xe máy', 'Xe đạp', 'Xe tải', 'Khác']),
    s('part_type', 'Loại phụ tùng', true, ['Lốp / Vỏ', 'Ắc quy', 'Đèn', 'Nhớt / Dầu', 'Phụ tùng động cơ', 'Ngoại thất', 'Nội thất', 'Âm thanh / Màn hình xe', 'Mũ bảo hiểm', 'Đồ chơi / Phụ kiện', 'Khác']),
    t('brand', 'Hãng'), t('compatible_models', 'Tương thích với dòng xe', false, { placeholder: 'VD: Honda Vision 2018-2022' }), origin(), warranty(),
  ] },
];
export const VEHICLE_GROUP: GroupSpec = { slug: 'xe-co', name: 'Xe cộ', order: 1, config: { priceModes: ['FIXED', 'CONTACT'], condition: 'required', minPrice: 500_000 },
  fields: [t('brand', 'Hãng xe', true), t('model', 'Dòng xe', true), y('year', 'Năm sản xuất', true, 1950), n('mileage', 'Số km đã đi', false, { min: 0, max: 2_000_000, unit: 'km', integer: true }), color(), vehicleDocs()], children: VEHICLES };

// ============================ NHÀ ĐẤT ============================
const areaM2 = (key: string, label: string, req = true) => n(key, label, req, { min: 1, max: 10_000_000, unit: 'm²' });
const rooms = (key: string, label: string, max = 30) => n(key, label, false, { min: 0, max, integer: true });
const deposit = () => money('deposit', 'Tiền đặt cọc', false, { max: 10_000_000_000 });
const availableFrom = () => d('available_from', 'Có thể vào ở / sử dụng từ');
const dealType = (req = true) => s('deal_type', 'Hình thức', req, ['Bán', 'Cho thuê']);
const leaseMin = () => s('lease_min', 'Thời hạn thuê tối thiểu', false, ['Không yêu cầu', '3 tháng', '6 tháng', '1 năm', '2 năm trở lên']);
const SALE = { priceModes: ['FIXED', 'CONTACT'], minPrice: 1_000_000 };
const RENT = { priceModes: ['MONTH', 'CONTACT'], minPrice: 100_000 };
const PROPERTY: LeafSpec[] = [
  { slug: 'ban-nha', name: 'Bán nhà', config: { ...SALE, minPrice: 10_000_000 }, fields: [
    s('property_type', 'Loại nhà', true, ['Nhà riêng', 'Nhà mặt phố', 'Nhà trong hẻm', 'Nhà cấp 4', 'Biệt thự', 'Nhà liền kề', 'Nhà vườn', 'Khác']),
    areaM2('land_area', 'Diện tích đất'), areaM2('usable_area', 'Diện tích sử dụng', false), n('floors', 'Số tầng', false, { min: 1, max: 50, integer: true }),
    rooms('bedrooms', 'Số phòng ngủ'), rooms('bathrooms', 'Số phòng vệ sinh'), s('direction', 'Hướng nhà', false, DIRECTIONS),
    n('frontage', 'Chiều ngang / mặt tiền', false, { min: 1, max: 1000, unit: 'm' }), n('road_width', 'Đường vào rộng', false, { min: 0.5, max: 100, unit: 'm' }),
    s('legal', 'Pháp lý', true, LEGAL), s('furnished', 'Nội thất', false, FURNISHED), s('property_state', 'Tình trạng nhà', false, ['Mới xây', 'Còn tốt', 'Cần sửa chữa', 'Cần xây lại']), y('build_year', 'Năm xây dựng', false, 1900),
  ] },
  { slug: 'ban-dat', name: 'Bán đất', config: { priceModes: ['FIXED', 'M2', 'CONTACT'], minPrice: 1_000_000 }, fields: [
    s('land_type', 'Loại đất', true, ['Đất thổ cư', 'Đất nền dự án', 'Đất nông nghiệp', 'Đất vườn', 'Đất rừng', 'Đất công nghiệp / Kho xưởng', 'Khác']),
    areaM2('area', 'Diện tích'), n('width', 'Chiều ngang', false, { min: 1, max: 10_000, unit: 'm' }), n('length', 'Chiều dài', false, { min: 1, max: 10_000, unit: 'm' }),
    s('direction', 'Hướng', false, DIRECTIONS), n('road_width', 'Đường vào rộng', false, { min: 0.5, max: 100, unit: 'm' }), s('legal', 'Pháp lý', true, LEGAL),
    s('planning', 'Quy hoạch', false, ['Không quy hoạch', 'Đã có quy hoạch', 'Đang quy hoạch', 'Chưa rõ']), s('position', 'Vị trí', false, ['Mặt tiền', 'Trong hẻm', 'Lô góc', 'Sát sông / biển', 'Khác']),
  ] },
  { slug: 'can-ho', name: 'Căn hộ', config: { priceModes: ['FIXED', 'MONTH', 'CONTACT'], minPrice: 100_000 }, fields: [
    dealType(), s('apartment_type', 'Loại căn hộ', true, ['Chung cư', 'Căn hộ dịch vụ', 'Căn hộ mini / Studio', 'Duplex', 'Penthouse', 'Officetel', 'Condotel']),
    t('project', 'Tên dự án / Tòa nhà'), areaM2('area', 'Diện tích'), rooms('bedrooms', 'Số phòng ngủ', 10), rooms('bathrooms', 'Số phòng vệ sinh', 10),
    n('floor_no', 'Tầng', false, { min: 0, max: 120, integer: true }), s('direction', 'Hướng', false, DIRECTIONS), s('balcony_direction', 'Hướng ban công', false, DIRECTIONS),
    s('legal', 'Pháp lý', false, LEGAL, { visibleWhen: { field: 'deal_type', operator: 'eq', value: 'Bán' } }), s('furnished', 'Nội thất', false, FURNISHED),
    s('handover', 'Tình trạng bàn giao', false, ['Đã bàn giao', 'Chưa bàn giao']), deposit(),
  ] },
  { slug: 'phong-tro', name: 'Phòng trọ', config: { ...RENT, maxPrice: 50_000_000 }, fields: [
    s('room_type', 'Loại phòng', true, ['Phòng trọ', 'Nhà trọ', 'Căn hộ mini', 'Ký túc xá / Ở ghép', 'Phòng homestay']), areaM2('area', 'Diện tích'),
    n('capacity', 'Số người tối đa', false, { min: 1, max: 20, integer: true }), s('furnished', 'Nội thất', false, FURNISHED), b('private_wc', 'Vệ sinh khép kín'),
    ms('amenities', 'Tiện nghi', ['Điều hòa', 'Nóng lạnh', 'Wifi', 'Gác lửng', 'Ban công', 'Bếp riêng', 'Máy giặt', 'Chỗ để xe', 'Camera an ninh', 'Giờ giấc tự do']),
    deposit(), t('electricity_price', 'Giá điện', false, { placeholder: 'VD: 3.500 đ/kWh' }), t('water_price', 'Giá nước', false, { placeholder: 'VD: 20.000 đ/người' }), availableFrom(),
  ] },
  { slug: 'cho-thue-nha', name: 'Cho thuê nhà', config: { ...RENT, maxPrice: 1_000_000_000 }, fields: [
    s('property_type', 'Loại nhà', true, ['Nhà nguyên căn', 'Nhà mặt phố', 'Nhà trong hẻm', 'Nhà cấp 4', 'Biệt thự', 'Khác']), areaM2('area', 'Diện tích'),
    n('floors', 'Số tầng', false, { min: 1, max: 50, integer: true }), rooms('bedrooms', 'Số phòng ngủ'), rooms('bathrooms', 'Số phòng vệ sinh'),
    s('furnished', 'Nội thất', false, FURNISHED), s('direction', 'Hướng nhà', false, DIRECTIONS), deposit(), leaseMin(), availableFrom(),
  ] },
  { slug: 'cho-thue-mat-bang', name: 'Cho thuê mặt bằng', config: { priceModes: ['MONTH', 'M2', 'CONTACT'], minPrice: 100_000 }, fields: [
    s('use_type', 'Phù hợp kinh doanh', true, ['Cửa hàng / Bán lẻ', 'Nhà hàng / Quán cà phê', 'Kho bãi', 'Văn phòng', 'Spa / Salon', 'Khác']), areaM2('area', 'Diện tích'),
    n('frontage', 'Mặt tiền', false, { min: 1, max: 1000, unit: 'm' }), n('floors', 'Số tầng', false, { min: 1, max: 50, integer: true }), n('road_width', 'Đường trước mặt bằng rộng', false, { min: 0.5, max: 100, unit: 'm' }),
    ms('amenities', 'Tiện ích', ['Điện 3 pha', 'Điều hòa', 'Chỗ đậu ô tô', 'Chỗ để xe máy', 'Thang máy', 'Camera an ninh']), deposit(), leaseMin(), availableFrom(),
  ] },
  { slug: 'van-phong', name: 'Văn phòng', config: { priceModes: ['FIXED', 'MONTH', 'M2', 'CONTACT'], minPrice: 100_000 }, fields: [
    dealType(), s('office_type', 'Loại văn phòng', true, ['Văn phòng truyền thống', 'Officetel', 'Co-working', 'Văn phòng ảo', 'Khác']), t('building', 'Tòa nhà / Dự án'),
    areaM2('area', 'Diện tích'), n('floor_no', 'Tầng', false, { min: 0, max: 120, integer: true }), s('furnished', 'Nội thất', false, FURNISHED), b('parking', 'Có chỗ đậu xe'),
    s('legal', 'Pháp lý', false, LEGAL, { visibleWhen: { field: 'deal_type', operator: 'eq', value: 'Bán' } }), deposit(), availableFrom(),
  ] },
  { slug: 'bat-dong-san-khac', name: 'Bất động sản khác', config: { priceModes: ['FIXED', 'MONTH', 'CONTACT'], minPrice: 100_000 }, fields: [
    dealType(), s('property_type', 'Loại bất động sản', true, ['Kho / Xưởng', 'Trang trại / Resort', 'Nhà hàng / Khách sạn', 'Bãi đỗ xe', 'Khác']), areaM2('area', 'Diện tích'),
    s('legal', 'Pháp lý', false, LEGAL, { visibleWhen: { field: 'deal_type', operator: 'eq', value: 'Bán' } }), t('key_features', 'Đặc điểm nổi bật'),
  ] },
];
export const PROPERTY_GROUP: GroupSpec = { slug: 'bat-dong-san', name: 'Bất động sản', order: 2, config: { priceModes: ['FIXED', 'MONTH', 'M2', 'CONTACT'], condition: 'none', minPrice: 100_000 },
  fields: [s('property_type', 'Loại bất động sản', true, ['Nhà riêng', 'Nhà mặt phố', 'Biệt thự', 'Căn hộ', 'Đất', 'Phòng trọ', 'Văn phòng / Mặt bằng', 'Khác']), areaM2('land_area', 'Diện tích'), s('legal', 'Pháp lý', false, LEGAL)],
  children: PROPERTY.map(p => ({ ...p, config: { condition: 'none', ...p.config } })) };
// ============================ ĐỒ GIA DỤNG & NỘI THẤT ============================
const dims = () => t('dimensions', 'Kích thước (D x R x C)', false, { placeholder: 'VD: 200 x 90 x 80 cm' });
const applianceYear = () => y('year', 'Năm sản xuất', false, 2000);
const HOME: LeafSpec[] = [
  { slug: 'sofa', name: 'Sofa', fields: [
    s('sofa_type', 'Loại sofa', true, ['Sofa góc (L)', 'Sofa văng', 'Sofa đơn', 'Sofa giường', 'Ghế thư giãn', 'Khác']),
    s('material', 'Chất liệu', true, ['Da thật', 'Da PU', 'Vải', 'Nỉ / Nhung', 'Gỗ', 'Khác']), n('seats', 'Số chỗ ngồi', false, { min: 1, max: 12, integer: true }), dims(), color(), t('brand', 'Thương hiệu'), origin(),
  ] },
  { slug: 'ban-ghe', name: 'Bàn ghế', fields: [
    s('furniture_type', 'Loại', true, ['Bàn ăn', 'Bàn làm việc', 'Bàn trà / Bàn sofa', 'Bàn trang điểm', 'Ghế ăn', 'Ghế văn phòng', 'Ghế thư giãn', 'Bộ bàn ghế', 'Khác']),
    s('material', 'Chất liệu', true, ['Gỗ tự nhiên', 'Gỗ công nghiệp', 'Kính', 'Kim loại', 'Nhựa', 'Mây tre', 'Khác']), n('seats', 'Số chỗ ngồi', false, { min: 1, max: 30, integer: true }), dims(), color(), t('brand', 'Thương hiệu'),
  ] },
  { slug: 'tu', name: 'Tủ', fields: [
    s('cabinet_type', 'Loại tủ', true, ['Tủ quần áo', 'Tủ giày', 'Tủ bếp', 'Kệ / Tủ tivi', 'Tủ sách', 'Tủ đầu giường', 'Tủ trang trí', 'Khác']),
    s('material', 'Chất liệu', true, ['Gỗ tự nhiên', 'Gỗ công nghiệp', 'Kim loại', 'Nhựa', 'Kính', 'Khác']), n('doors', 'Số cánh / ngăn', false, { min: 1, max: 20, integer: true }), dims(), color(), t('brand', 'Thương hiệu'),
  ] },
  { slug: 'giuong', name: 'Giường', fields: [
    s('bed_type', 'Loại', true, ['Giường đơn', 'Giường đôi', 'Giường tầng', 'Giường sofa', 'Nệm / Đệm', 'Khác']),
    s('bed_size', 'Kích thước', true, ['1m x 2m', '1m2 x 2m', '1m4 x 2m', '1m6 x 2m', '1m8 x 2m', '2m x 2m2', 'Khác']),
    s('material', 'Chất liệu', false, ['Gỗ tự nhiên', 'Gỗ công nghiệp', 'Kim loại', 'Bọc da / vải', 'Khác']), b('mattress_included', 'Kèm nệm'), color(), t('brand', 'Thương hiệu'),
  ] },
  { slug: 'tu-lanh', name: 'Tủ lạnh', fields: [
    t('brand', 'Hãng', true), t('model', 'Model'),
    s('fridge_type', 'Kiểu tủ', true, ['Ngăn đá trên', 'Ngăn đá dưới', 'Side by side', 'Multi door', 'Mini', 'Tủ đông', 'Tủ mát']),
    n('capacity_l', 'Dung tích', true, { min: 30, max: 1500, unit: 'lít', integer: true }), b('inverter', 'Công nghệ Inverter'), applianceYear(), color(), origin(), warranty(),
  ] },
  { slug: 'may-giat', name: 'Máy giặt', fields: [
    t('brand', 'Hãng', true), t('model', 'Model'), s('washer_type', 'Kiểu máy', true, ['Cửa trước', 'Cửa trên', 'Lồng đôi', 'Máy sấy', 'Giặt sấy']),
    n('capacity_kg', 'Khối lượng giặt', true, { min: 2, max: 30, unit: 'kg' }), b('inverter', 'Công nghệ Inverter'), applianceYear(), origin(), warranty(),
  ] },
  { slug: 'dieu-hoa', name: 'Điều hòa', fields: [
    t('brand', 'Hãng', true), t('model', 'Model'), s('ac_type', 'Loại máy', true, ['Treo tường', 'Âm trần', 'Tủ đứng', 'Di động', 'Giấu trần']),
    s('power_btu', 'Công suất', true, ['9.000 BTU (1 HP)', '12.000 BTU (1.5 HP)', '18.000 BTU (2 HP)', '24.000 BTU (2.5 HP)', 'Trên 24.000 BTU']),
    s('ac_mode', 'Chiều', false, ['1 chiều (lạnh)', '2 chiều (nóng/lạnh)']), b('inverter', 'Công nghệ Inverter'), b('installation_included', 'Kèm lắp đặt'), applianceYear(), warranty(),
  ] },
  { slug: 'thiet-bi-nha-bep', name: 'Thiết bị nhà bếp', fields: [
    s('kitchen_type', 'Loại thiết bị', true, ['Nồi cơm điện', 'Bếp từ / Bếp ga', 'Lò vi sóng / Lò nướng', 'Nồi chiên không dầu', 'Máy xay / Máy ép', 'Máy hút mùi', 'Máy rửa bát', 'Dụng cụ nấu ăn', 'Khác']),
    t('brand', 'Hãng'), t('model', 'Model'), n('power_w', 'Công suất', false, { min: 1, max: 20000, unit: 'W' }), n('capacity_l', 'Dung tích', false, { min: 0.1, max: 1000, unit: 'lít' }), applianceYear(), warranty(),
  ] },
];
export const HOME_GROUP: GroupSpec = { slug: 'do-gia-dung', name: 'Đồ gia dụng', order: 3, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required', minPrice: 1000 },
  fields: [t('brand', 'Thương hiệu'), t('model', 'Model'), t('material', 'Chất liệu'), origin(), warranty()], children: HOME };

// ============================ THỜI TRANG ============================
const audience = (req = true) => s('audience', 'Đối tượng', req, AUDIENCE);
const FASHION: LeafSpec[] = [
  { slug: 'quan-ao', name: 'Quần áo', fields: [
    audience(), s('garment_type', 'Loại trang phục', true, ['Áo thun / Áo sơ mi', 'Áo khoác', 'Quần', 'Váy / Đầm', 'Đồ bộ', 'Đồ lót', 'Đồ thể thao', 'Đồ truyền thống', 'Khác']),
    s('size', 'Kích cỡ', true, ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free size']), t('brand', 'Thương hiệu'), t('color', 'Màu sắc', true, { maxLength: 60 }), t('material', 'Chất liệu', false, { maxLength: 100 }),
  ] },
  { slug: 'giay-dep', name: 'Giày dép', fields: [
    audience(), s('shoe_type', 'Loại giày dép', true, ['Giày thể thao / Sneaker', 'Giày tây', 'Giày cao gót', 'Sandal', 'Dép', 'Bốt', 'Giày lười', 'Khác']),
    s('shoe_size', 'Size (EU)', true, ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47']), t('brand', 'Thương hiệu'), t('color', 'Màu sắc', false, { maxLength: 60 }),
    t('material', 'Chất liệu', false, { maxLength: 100 }), s('authentic', 'Nguồn gốc', false, AUTHENTIC),
  ] },
  { slug: 'tui-xach', name: 'Túi xách', fields: [
    s('bag_type', 'Loại', true, ['Túi xách tay', 'Túi đeo chéo', 'Balo', 'Ví', 'Vali', 'Túi du lịch', 'Khác']), audience(), t('brand', 'Thương hiệu'),
    s('material', 'Chất liệu', false, ['Da thật', 'Da PU', 'Vải', 'Nhựa', 'Khác']), t('color', 'Màu sắc', false, { maxLength: 60 }), t('dimensions', 'Kích thước', false, { placeholder: 'VD: 30 x 20 x 10 cm' }), s('authentic', 'Nguồn gốc', false, AUTHENTIC),
  ] },
  { slug: 'thoi-trang-dong-ho', name: 'Đồng hồ', config: { maxPrice: 5_000_000_000 }, fields: [
    audience(), t('brand', 'Thương hiệu', true), t('model', 'Model'), s('watch_type', 'Loại máy', false, ['Cơ (automatic)', 'Pin (quartz)', 'Năng lượng ánh sáng', 'Khác']),
    n('case_size', 'Đường kính mặt', false, { min: 20, max: 60, unit: 'mm' }), s('strap_material', 'Chất liệu dây', false, ['Kim loại', 'Da', 'Silicone / Cao su', 'Vải', 'Khác']),
    s('glass', 'Mặt kính', false, ['Sapphire', 'Khoáng', 'Nhựa / Acrylic']), s('water_resistance', 'Chống nước', false, ['Không', '30m', '50m', '100m', '200m trở lên']),
    b('box_papers', 'Đủ hộp và giấy tờ'), s('authentic', 'Nguồn gốc', false, AUTHENTIC),
  ] },
  { slug: 'phu-kien-thoi-trang', name: 'Phụ kiện', fields: [
    s('accessory_type', 'Loại phụ kiện', true, ['Trang sức', 'Kính mắt', 'Nón / Mũ', 'Thắt lưng', 'Khăn / Găng tay', 'Cà vạt / Nơ', 'Khác']), audience(false), t('brand', 'Thương hiệu'),
    t('material', 'Chất liệu', false, { maxLength: 100 }), t('color', 'Màu sắc', false, { maxLength: 60 }),
  ] },
];
export const FASHION_GROUP: GroupSpec = { slug: 'thoi-trang', name: 'Thời trang', order: 4, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required', minPrice: 1000 },
  fields: [t('brand', 'Thương hiệu'), audience(false), t('color', 'Màu sắc', false, { maxLength: 60 }), t('material', 'Chất liệu', false, { maxLength: 100 })], children: FASHION };

// ============================ THỂ THAO & GIẢI TRÍ ============================
const gameAcc = ['Tay cầm', 'Dây nguồn / HDMI', 'Hộp máy', 'Đĩa game', 'Tai nghe', 'Kính VR'];
const SPORTS: LeafSpec[] = [
  { slug: 'playstation', name: 'Playstation', fields: [
    s('model', 'Dòng máy', true, ['PS5', 'PS5 Slim', 'PS5 Digital', 'PS4 Pro', 'PS4 Slim', 'PS4', 'PS3', 'PS Vita', 'PS VR / VR2', 'Khác']), s('storage', 'Bộ nhớ', false, ['500 GB', '825 GB', '1 TB', '2 TB', 'Khác']),
    n('controllers', 'Số tay cầm đi kèm', false, { min: 0, max: 8, integer: true }), t('includes_games', 'Game đi kèm'), b('modded', 'Đã can thiệp phần mềm (jailbreak/mod)'), ms('accessories', 'Phụ kiện đi kèm', gameAcc), warranty(),
  ] },
  { slug: 'xbox', name: 'Xbox', fields: [
    s('model', 'Dòng máy', true, ['Xbox Series X', 'Xbox Series S', 'Xbox One X', 'Xbox One S', 'Xbox One', 'Xbox 360', 'Khác']), s('storage', 'Bộ nhớ', false, ['500 GB', '512 GB', '1 TB', '2 TB', 'Khác']),
    n('controllers', 'Số tay cầm đi kèm', false, { min: 0, max: 8, integer: true }), t('includes_games', 'Game đi kèm'), b('modded', 'Đã can thiệp phần mềm (mod)'), ms('accessories', 'Phụ kiện đi kèm', gameAcc), warranty(),
  ] },
  { slug: 'nintendo', name: 'Nintendo', fields: [
    s('model', 'Dòng máy', true, ['Switch OLED', 'Switch', 'Switch Lite', 'Switch 2', '3DS / 2DS', 'Wii / Wii U', 'Khác']), s('storage', 'Bộ nhớ', false, ['32 GB', '64 GB', '128 GB', '256 GB', 'Khác']),
    n('controllers', 'Số tay cầm / Joy-Con', false, { min: 0, max: 8, integer: true }), t('includes_games', 'Game đi kèm'), b('modded', 'Đã can thiệp phần mềm (mod)'), ms('accessories', 'Phụ kiện đi kèm', ['Dock', 'Sạc', 'Joy-Con', 'Hộp máy', 'Thẻ nhớ', 'Ốp / Túi']), warranty(),
  ] },
  { slug: 'dung-cu-the-thao', name: 'Dụng cụ thể thao', fields: [
    s('sport', 'Môn thể thao', true, ['Bóng đá', 'Cầu lông', 'Tennis / Pickleball', 'Bóng rổ / Bóng chuyền', 'Gym / Fitness', 'Yoga / Pilates', 'Chạy bộ', 'Bơi lội', 'Golf', 'Câu cá', 'Cắm trại / Leo núi', 'Khác']),
    t('item', 'Loại dụng cụ', true, { placeholder: 'VD: Vợt, Tạ tay, Giày đá bóng' }), t('brand', 'Thương hiệu'), t('size_weight', 'Kích cỡ / Trọng lượng'), s('audience', 'Đối tượng', false, AUDIENCE), warranty(),
  ] },
  { slug: 'nhac-cu', name: 'Nhạc cụ', fields: [
    s('instrument', 'Loại nhạc cụ', true, ['Guitar', 'Piano / Organ', 'Trống', 'Violin / Cello', 'Ukulele', 'Kèn / Sáo', 'Đàn dân tộc', 'DJ / Thiết bị thu âm', 'Khác']), t('brand', 'Thương hiệu'), t('model', 'Model'),
    y('year', 'Năm sản xuất', false, 1800), ms('accessories', 'Phụ kiện đi kèm', ['Bao / Hộp đàn', 'Dây dự phòng', 'Chân đế', 'Ampli', 'Sách / Giáo trình']), warranty(),
  ] },
  { slug: 'do-choi', name: 'Đồ chơi', fields: [
    s('toy_type', 'Loại đồ chơi', true, ['Lego / Xếp hình', 'Mô hình / Nhân vật', 'Đồ chơi giáo dục', 'Đồ chơi điều khiển', 'Búp bê', 'Board game', 'Đồ chơi vận động', 'Khác']),
    s('age_range', 'Độ tuổi phù hợp', true, ['0 - 12 tháng', '1 - 3 tuổi', '3 - 6 tuổi', '6 - 12 tuổi', 'Trên 12 tuổi', 'Mọi lứa tuổi']), t('brand', 'Thương hiệu'), s('material', 'Chất liệu', false, ['Nhựa', 'Gỗ', 'Vải / Bông', 'Kim loại', 'Khác']), b('battery_required', 'Cần pin'),
  ] },
];
export const SPORTS_GROUP: GroupSpec = { slug: 'the-thao', name: 'Thể thao', order: 5, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required', minPrice: 1000 },
  fields: [t('brand', 'Thương hiệu'), t('model', 'Model'), warranty()], children: SPORTS };

// ============================ SÁCH & VĂN PHÒNG PHẨM ============================
const LANG = ['Tiếng Việt', 'Tiếng Anh', 'Song ngữ', 'Tiếng Nhật', 'Tiếng Hàn', 'Tiếng Trung', 'Khác'];
const BOOKS: LeafSpec[] = [
  { slug: 'sach', name: 'Sách', config: { maxPrice: 100_000_000 }, fields: [
    t('author', 'Tác giả', true), t('publisher', 'Nhà xuất bản'), y('year', 'Năm xuất bản', false, 1900), s('language', 'Ngôn ngữ', false, LANG),
    s('genre', 'Thể loại', true, ['Văn học', 'Kinh tế / Kinh doanh', 'Kỹ năng sống', 'Thiếu nhi', 'Khoa học', 'Lịch sử', 'Giáo khoa / Tham khảo', 'Ngoại ngữ', 'Truyện tranh / Manga', 'Tạp chí', 'Khác']),
    s('cover', 'Loại bìa', false, ['Bìa mềm', 'Bìa cứng']), n('pages', 'Số trang', false, { min: 1, max: 5000, integer: true }), t('isbn', 'Mã ISBN', false, { maxLength: 20 }),
  ] },
  { slug: 'giao-trinh', name: 'Giáo trình', fields: [
    t('subject', 'Môn học / Chuyên ngành', true), s('level', 'Cấp học', true, ['Tiểu học', 'THCS', 'THPT', 'Đại học / Cao đẳng', 'Luyện thi / Chứng chỉ', 'Ngoại ngữ', 'Khác']),
    t('author', 'Tác giả'), t('publisher', 'Nhà xuất bản'), y('year', 'Năm xuất bản', false, 1950), s('language', 'Ngôn ngữ', false, LANG), n('volumes', 'Số cuốn trong bộ', false, { min: 1, max: 200, integer: true }),
  ] },
  { slug: 'do-dung-hoc-tap', name: 'Đồ dùng học tập', fields: [
    s('item_type', 'Loại đồ dùng', true, ['Bút / Viết', 'Vở / Sổ', 'Cặp / Balo', 'Máy tính bỏ túi', 'Dụng cụ vẽ', 'Hộp / Đồ dùng bàn học', 'Khác']), t('brand', 'Thương hiệu'),
    n('quantity', 'Số lượng', false, { min: 1, max: 100000, integer: true }), s('age_range', 'Cấp học phù hợp', false, ['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'Đại học', 'Mọi cấp']),
  ] },
];
export const BOOKS_GROUP: GroupSpec = { slug: 'sach-van-phong-pham', name: 'Sách & Văn phòng phẩm', order: 6, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required', minPrice: 1000 },
  fields: [t('brand', 'Thương hiệu / Tác giả'), s('language', 'Ngôn ngữ', false, LANG)], children: BOOKS };

// ============================ MÁY MÓC & CÔNG CỤ ============================
const VOLTAGE = ['220V', '380V', '220V / 380V', 'Pin / Không dùng điện', 'Khác'];
const hours = () => n('hours_used', 'Số giờ đã hoạt động', false, { min: 0, max: 200000, unit: 'giờ', integer: true });
const mYear = () => y('year', 'Năm sản xuất', false, 1960);
const MACHINERY: LeafSpec[] = [
  { slug: 'may-moc-cong-nghiep', name: 'Máy móc công nghiệp', fields: [
    s('machine_type', 'Loại máy', true, ['Máy CNC / Gia công', 'Máy hàn / Cắt', 'Máy nén khí', 'Máy phát điện', 'Máy bơm', 'Máy đóng gói / Chế biến', 'Băng tải / Nâng hạ', 'Khác']),
    t('brand', 'Hãng', true), t('model', 'Model'), mYear(), n('power_kw', 'Công suất', false, { min: 0.1, max: 100000, unit: 'kW' }), s('voltage', 'Điện áp', false, VOLTAGE), hours(), origin(), warranty(),
  ] },
  { slug: 'may-moc-nong-nghiep', name: 'Máy móc nông nghiệp', fields: [
    s('machine_type', 'Loại máy', true, ['Máy cày / Máy kéo', 'Máy gặt', 'Máy phun thuốc', 'Máy bơm nước', 'Máy xay xát / Sấy', 'Máy cắt cỏ', 'Khác']),
    t('brand', 'Hãng', true), t('model', 'Model'), mYear(), n('power_hp', 'Công suất', false, { min: 0.5, max: 1000, unit: 'HP' }), s('fuel', 'Nhiên liệu', false, ['Dầu', 'Xăng', 'Điện', 'Khác']), hours(), origin(), warranty(),
  ] },
  { slug: 'thiet-bi-xay-dung', name: 'Thiết bị xây dựng', fields: [
    s('equipment_type', 'Loại thiết bị', true, ['Máy xúc / Máy đào', 'Xe ủi / Xe lu', 'Máy trộn bê tông', 'Giàn giáo / Cốp pha', 'Máy khoan / Máy đục', 'Cần trục / Cẩu', 'Khác']),
    t('brand', 'Hãng', true), t('model', 'Model'), mYear(), n('weight_ton', 'Trọng lượng / Tải trọng', false, { min: 0.01, max: 1000, unit: 'tấn' }), hours(), origin(), warranty(),
  ] },
  { slug: 'dung-cu', name: 'Dụng cụ', fields: [
    s('tool_type', 'Loại dụng cụ', true, ['Dụng cụ cầm tay', 'Dụng cụ điện cầm tay', 'Máy cắt / Mài', 'Máy khoan', 'Bộ dụng cụ', 'Đồ nghề sửa chữa', 'Khác']), t('brand', 'Hãng'),
    s('power_source', 'Nguồn năng lượng', false, ['Điện (có dây)', 'Pin', 'Xăng', 'Khí nén', 'Cơ (không động cơ)']), n('power_w', 'Công suất', false, { min: 1, max: 100000, unit: 'W' }), n('set_count', 'Số chi tiết trong bộ', false, { min: 1, max: 1000, integer: true }), warranty(),
  ] },
  { slug: 'dung-cu-co-khi', name: 'Dụng cụ cơ khí', fields: [
    s('tool_type', 'Loại thiết bị', true, ['Máy tiện / Phay / Bào', 'Máy mài', 'Máy hàn', 'Dụng cụ đo (thước, panme)', 'Dụng cụ cầm tay cơ khí', 'Khuôn / Dao cắt', 'Khác']),
    t('brand', 'Hãng'), t('model', 'Model'), n('power_kw', 'Công suất', false, { min: 0.05, max: 10000, unit: 'kW' }), s('voltage', 'Điện áp', false, VOLTAGE), mYear(), origin(), warranty(),
  ] },
  { slug: 'thiet-bi-dien', name: 'Thiết bị điện', fields: [
    s('electric_type', 'Loại thiết bị', true, ['Tủ điện / Aptomat', 'Biến áp / Ổn áp', 'Máy phát điện', 'Bộ lưu điện UPS', 'Đèn chiếu sáng công nghiệp', 'Dây cáp điện', 'Khác']),
    t('brand', 'Hãng'), t('model', 'Model'), n('power_kva', 'Công suất', false, { min: 0.1, max: 100000, unit: 'kVA' }), s('phases', 'Số pha', false, ['1 pha', '3 pha']), s('voltage', 'Điện áp', false, VOLTAGE), warranty(),
  ] },
  { slug: 'thiet-bi-nha-hang', name: 'Thiết bị nhà hàng', fields: [
    s('equipment_type', 'Loại thiết bị', true, ['Bếp công nghiệp', 'Tủ đông / Tủ mát', 'Máy làm đá', 'Lò nướng công nghiệp', 'Máy rửa chén', 'Bàn ghế nhà hàng', 'Máy pha cà phê', 'Khác']),
    t('brand', 'Hãng'), t('model', 'Model'), t('capacity', 'Công suất / Dung tích', false, { placeholder: 'VD: 200 lít, 30 kg đá/ngày' }), s('voltage', 'Điện áp', false, VOLTAGE), mYear(), warranty(),
  ] },
  { slug: 'thiet-bi-cua-hang', name: 'Thiết bị cửa hàng', fields: [
    s('equipment_type', 'Loại thiết bị', true, ['Kệ trưng bày', 'Quầy thu ngân', 'Máy POS / Máy in hóa đơn', 'Máy quét mã vạch', 'Camera / An ninh', 'Ma-nơ-canh / Mô hình trưng bày', 'Tủ kính', 'Khác']),
    t('brand', 'Hãng'), t('model', 'Model'), n('quantity', 'Số lượng', false, { min: 1, max: 10000, integer: true }), t('size', 'Kích thước'), warranty(),
  ] },
  { slug: 'thiet-bi-van-phong', name: 'Thiết bị văn phòng', fields: [
    s('equipment_type', 'Loại thiết bị', true, ['Máy in / Photocopy', 'Máy chiếu', 'Bàn / Ghế văn phòng', 'Máy hủy giấy', 'Tủ hồ sơ', 'Điện thoại / Tổng đài', 'Màn hình trình chiếu', 'Khác']),
    t('brand', 'Hãng'), t('model', 'Model'), n('quantity', 'Số lượng', false, { min: 1, max: 10000, integer: true }), mYear(), warranty(),
  ] },
  { slug: 'nguyen-vat-lieu', name: 'Nguyên vật liệu', fields: [
    s('material_type', 'Loại vật liệu', true, ['Sắt thép', 'Gỗ', 'Xi măng / Cát / Đá', 'Gạch / Ngói', 'Nhựa / Cao su', 'Vải / Da', 'Hóa chất', 'Khác']),
    n('quantity', 'Số lượng', true, { min: 0.01, max: 100000000 }), s('unit', 'Đơn vị', true, ['Kg', 'Tấn', 'Mét', 'm²', 'm³', 'Cái', 'Bao', 'Khác']), t('specification', 'Quy cách / Kích thước'), origin(),
  ] },
  { slug: 'giong-cay-trong', name: 'Giống cây trồng', config: { condition: 'none' }, fields: [
    s('plant_type', 'Loại giống', true, ['Hạt giống', 'Cây giống', 'Cành giâm / Chiết', 'Củ giống', 'Cây ăn trái', 'Cây cảnh', 'Hoa', 'Khác']), t('plant_name', 'Tên giống', true),
    n('quantity', 'Số lượng', true, { min: 1, max: 10000000, integer: true }), s('unit', 'Đơn vị', true, ['Cây', 'Bầu', 'Gói', 'Kg', 'Củ']), n('age_months', 'Tuổi cây', false, { min: 0, max: 600, unit: 'tháng', integer: true }), origin(),
  ] },
  { slug: 'may-moc-khac', name: 'Máy móc khác', fields: [t('item_type', 'Loại máy / thiết bị', true), t('brand', 'Hãng'), t('model', 'Model'), mYear(), ta('specs', 'Thông số kỹ thuật'), warranty()] },
];
export const MACHINERY_GROUP: GroupSpec = { slug: 'may-moc-cong-cu', name: 'Máy móc & công cụ', order: 7, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required', minPrice: 1000 },
  fields: [t('brand', 'Hãng'), t('model', 'Model'), mYear(), warranty()], children: MACHINERY };
// ============================ ĐỒ SƯU TẦM ============================
const COLLECT: LeafSpec[] = [
  { slug: 'suu-tam-dong-ho', name: 'Đồng hồ', config: { maxPrice: 10_000_000_000 }, fields: [
    t('maker', 'Hãng / Nhà sản xuất', true), t('reference', 'Mã / Đời máy'), y('year', 'Năm sản xuất', false, 1700), s('movement', 'Bộ máy', false, ['Cơ (lên dây tay)', 'Cơ (tự động)', 'Pin (quartz)', 'Bỏ túi', 'Khác']),
    s('material', 'Chất liệu vỏ', false, ['Thép không gỉ', 'Vàng', 'Bạc', 'Titan', 'Mạ vàng', 'Khác']), b('box_papers', 'Đủ hộp và giấy tờ'), t('certificate', 'Giấy giám định / chứng nhận'),
  ] },
  { slug: 'do-co', name: 'Đồ cổ', config: { maxPrice: 10_000_000_000 }, fields: [
    s('item_type', 'Loại đồ cổ', true, ['Gốm sứ', 'Đồng / Kim loại', 'Tranh / Thư pháp', 'Đồ gỗ / Điêu khắc', 'Ngọc / Đá quý', 'Tiền cổ / Xu', 'Đồ dùng cổ', 'Khác']),
    s('era', 'Niên đại', false, ['Trước thế kỷ 19', 'Thế kỷ 19', 'Đầu thế kỷ 20', '1945 - 1975', 'Sau 1975', 'Chưa xác định']), t('material', 'Chất liệu', false, { maxLength: 100 }), origin('Xuất xứ'),
    t('dimensions', 'Kích thước'), b('has_certificate', 'Có giấy giám định'), ta('provenance', 'Nguồn gốc / Lai lịch'),
  ] },
  { slug: 'mo-hinh', name: 'Mô hình', fields: [
    s('model_type', 'Loại mô hình', true, ['Nhân vật (figure)', 'Xe mô hình', 'Máy bay / Tàu', 'Gundam / Robot', 'Lego', 'Diorama', 'Khác']), t('maker', 'Hãng sản xuất'),
    s('scale', 'Tỷ lệ', false, ['1:6', '1:12', '1:18', '1:24', '1:43', '1:64', 'Khác']), t('franchise', 'Series / Nhân vật'), y('year', 'Năm phát hành', false, 1950),
    s('packaging', 'Tình trạng hộp', false, ['Còn nguyên hộp (seal)', 'Đã mở hộp', 'Không có hộp']), b('limited', 'Phiên bản giới hạn'),
  ] },
  { slug: 'tem', name: 'Tem', fields: [
    s('stamp_type', 'Loại tem', true, ['Tem Việt Nam', 'Tem nước ngoài', 'Tem cổ', 'Bộ tem / Bộ sưu tập', 'Phong bì FDC', 'Khác']), t('country', 'Quốc gia / Khu vực'), y('year', 'Năm phát hành', false, 1840),
    n('quantity', 'Số lượng', false, { min: 1, max: 1000000, integer: true }), s('grade', 'Tình trạng', false, ['Chưa sử dụng (mint)', 'Đã sử dụng', 'Có đóng dấu']), b('album_included', 'Kèm album'),
  ] },
  { slug: 'vat-pham-suu-tam', name: 'Vật phẩm sưu tầm', fields: [
    t('item_type', 'Loại vật phẩm', true), t('maker', 'Nhà sản xuất / Tác giả'), s('era', 'Niên đại', false, ['Trước 1945', '1945 - 1975', '1975 - 2000', 'Sau 2000', 'Chưa xác định']),
    t('material', 'Chất liệu', false, { maxLength: 100 }), origin('Xuất xứ'), t('certificate', 'Giấy chứng nhận'),
  ] },
];
export const COLLECT_GROUP: GroupSpec = { slug: 'do-suu-tam', name: 'Đồ sưu tầm', order: 8, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required', minPrice: 1000 },
  fields: [t('maker', 'Nhà sản xuất'), t('era', 'Niên đại'), origin()], children: COLLECT };

// ============================ THÚ CƯNG & VẬT DỤNG ============================
const PETS: LeafSpec[] = [
  { slug: 'thu-cung-canh', name: 'Thú cưng', config: { condition: 'none' }, fields: [
    s('pet_type', 'Loài', true, PET_TYPES), t('breed', 'Giống', true), s('gender', 'Giới tính', true, ['Đực', 'Cái', 'Chưa xác định']),
    n('age_months', 'Tuổi', true, { min: 0, max: 360, unit: 'tháng', integer: true }), n('weight_kg', 'Cân nặng', false, { min: 0.01, max: 200, unit: 'kg' }), t('color', 'Màu lông / Màu sắc', false, { maxLength: 60 }),
    s('vaccinated', 'Tiêm phòng', false, ['Đã tiêm đủ', 'Đã tiêm một phần', 'Chưa tiêm']), b('dewormed', 'Đã tẩy giun'), s('health', 'Sức khỏe', false, ['Khỏe mạnh', 'Đang điều trị', 'Có bệnh nền']),
    b('pedigree', 'Có giấy tờ / phả hệ', { help: 'Chỉ đăng bán vật nuôi có nguồn gốc hợp pháp; không đăng bán động vật hoang dã được bảo vệ.' }),
  ] },
  { slug: 'phu-kien-thu-cung', name: 'Phụ kiện', fields: [
    s('accessory_type', 'Loại phụ kiện', true, ['Chuồng / Lồng', 'Ổ nằm / Đệm', 'Dây dắt / Vòng cổ', 'Đồ chơi', 'Bát ăn / Uống', 'Quần áo', 'Đồ vệ sinh / Chải lông', 'Túi vận chuyển', 'Khác']),
    s('for_pet', 'Dùng cho', true, FORPET), t('brand', 'Thương hiệu'), s('size', 'Kích cỡ', false, ['XS', 'S', 'M', 'L', 'XL', 'Free size']), t('material', 'Chất liệu', false, { maxLength: 100 }), color(),
  ] },
  { slug: 'thuc-an-thu-cung', name: 'Thức ăn', config: { condition: 'none' }, fields: [
    s('for_pet', 'Dùng cho', true, FORPET), s('food_type', 'Loại thức ăn', true, ['Hạt khô', 'Pate / Thức ăn ướt', 'Snack / Bánh thưởng', 'Thực phẩm bổ sung', 'Cát vệ sinh', 'Khác']),
    t('brand', 'Thương hiệu', true), n('net_weight_kg', 'Khối lượng', true, { min: 0.01, max: 1000, unit: 'kg' }), d('expiry', 'Hạn sử dụng', true),
    s('age_group', 'Độ tuổi', false, ['Con', 'Trưởng thành', 'Già', 'Mọi lứa tuổi']), s('packaging', 'Bao bì', false, ['Còn nguyên seal', 'Đã mở']),
  ] },
];
export const PETS_GROUP: GroupSpec = { slug: 'thu-cung', name: 'Thú cưng & vật dụng', order: 9, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required', minPrice: 1000 },
  fields: [s('pet_type', 'Loài', false, PET_TYPES), t('breed', 'Giống')], children: PETS };

// ============================ THỰC PHẨM (mới) ============================
const expiry = (req = false) => d('expiry', 'Hạn sử dụng', req);
const storage = () => s('storage', 'Bảo quản', false, STORAGE_FOOD);
const foodCert = () => b('food_safety_cert', 'Có giấy chứng nhận an toàn thực phẩm');
const foodOrigin = () => t('origin', 'Nơi sản xuất / Xuất xứ', false, { maxLength: 150 });
const FOOD: LeafSpec[] = [
  { slug: 'do-an', name: 'Đồ ăn', config: { maxPrice: 20_000_000 }, fields: [
    s('dish_type', 'Loại món', true, ['Cơm / Bún / Phở', 'Bánh', 'Đồ ăn vặt', 'Món chay', 'Đồ nướng / Chiên', 'Khác']), s('preparation', 'Hình thức', true, ['Làm tươi theo đơn', 'Đóng gói sẵn']),
    n('best_within_hours', 'Nên dùng trong vòng', false, { min: 1, max: 720, unit: 'giờ', integer: true }), b('delivery_available', 'Có giao tận nơi'), foodCert(),
  ] },
  { slug: 'do-uong', name: 'Đồ uống', config: { maxPrice: 50_000_000 }, fields: [
    s('drink_type', 'Loại đồ uống', true, ['Trà / Trà sữa', 'Cà phê', 'Nước ép / Sinh tố', 'Nước giải khát', 'Rượu / Bia', 'Sữa', 'Khác']), n('volume_ml', 'Dung tích', false, { min: 1, max: 100000, unit: 'ml', integer: true }),
    n('abv', 'Nồng độ cồn', false, { min: 0, max: 100, unit: '%', help: 'Chỉ bán rượu bia cho người từ 18 tuổi trở lên.', visibleWhen: { field: 'drink_type', operator: 'eq', value: 'Rượu / Bia' } }),
    expiry(), storage(), foodCert(),
  ] },
  { slug: 'dac-san', name: 'Đặc sản', fields: [
    t('product_name', 'Tên đặc sản', true), t('region', 'Vùng miền / Nơi sản xuất', true), n('net_weight', 'Khối lượng / Số lượng', true, { min: 0.01, max: 1000000 }), s('unit', 'Đơn vị', true, UNITS_FOOD),
    expiry(true), storage(), s('process', 'Cách làm', false, ['Thủ công', 'Công nghiệp']), foodCert(),
  ] },
  { slug: 'rau-cu-trai-cay', name: 'Rau củ / Trái cây', fields: [
    s('produce_type', 'Loại', true, ['Rau xanh', 'Củ / Quả', 'Trái cây', 'Nấm', 'Gia vị / Rau thơm', 'Khác']), t('produce_name', 'Tên sản phẩm', true), s('cultivation', 'Canh tác', false, ['Hữu cơ / VietGAP', 'Thông thường', 'Tự trồng']),
    n('quantity', 'Số lượng', true, { min: 0.1, max: 1000000 }), s('unit', 'Đơn vị', true, ['Kg', 'Bó', 'Trái / Quả', 'Khay', 'Thùng']), d('harvest_date', 'Ngày thu hoạch'), storage(),
  ] },
  { slug: 'thuc-pham-tuoi-song', name: 'Thực phẩm tươi sống', fields: [
    s('fresh_type', 'Loại', true, ['Thịt', 'Hải sản', 'Gia cầm / Trứng', 'Cá', 'Sản phẩm sơ chế', 'Khác']), t('product_name', 'Tên sản phẩm', true), n('quantity', 'Số lượng', true, { min: 0.1, max: 1000000 }),
    s('unit', 'Đơn vị', true, ['Kg', 'Con', 'Khay', 'Gói']), s('storage', 'Bảo quản', true, ['Bảo quản lạnh', 'Đông lạnh']), d('processed_date', 'Ngày giết mổ / đánh bắt / sơ chế'), t('origin', 'Nguồn gốc / Trang trại'), b('quarantine_cert', 'Có giấy kiểm dịch / ATTP'),
  ] },
  { slug: 'thuc-pham-kho', name: 'Thực phẩm khô', fields: [
    s('dry_type', 'Loại', true, ['Gạo / Ngũ cốc', 'Mì / Bún / Miến khô', 'Hải sản khô', 'Gia vị', 'Hạt / Trái cây sấy', 'Trà / Cà phê', 'Đồ hộp', 'Khác']), t('product_name', 'Tên sản phẩm', true),
    n('net_weight', 'Khối lượng', true, { min: 0.01, max: 1000000 }), s('unit', 'Đơn vị', true, ['Gam', 'Kg', 'Gói', 'Hộp']), expiry(true), t('brand', 'Thương hiệu'), foodOrigin(), storage(),
  ] },
  { slug: 'do-handmade', name: 'Đồ handmade', fields: [
    s('handmade_type', 'Loại sản phẩm', true, ['Bánh / Kẹo handmade', 'Mứt / Đồ muối', 'Xà phòng / Mỹ phẩm thiên nhiên', 'Nến / Tinh dầu', 'Đồ thủ công / Trang trí', 'Đồ len / Đan móc', 'Khác']),
    t('material', 'Chất liệu / Nguyên liệu', false, { maxLength: 200 }), n('lead_time_days', 'Thời gian làm', false, { min: 0, max: 365, unit: 'ngày', integer: true }), b('customizable', 'Nhận làm theo yêu cầu'), expiry(),
  ] },
  { slug: 'thuc-pham-khac', name: 'Khác', fields: [t('product_name', 'Tên sản phẩm', true), t('product_group', 'Nhóm sản phẩm'), n('net_weight', 'Khối lượng / Số lượng', false, { min: 0.01, max: 1000000 }), expiry(), storage(), foodOrigin()] },
];
export const FOOD_GROUP: GroupSpec = { slug: 'thuc-pham', name: 'Thực phẩm', order: 13, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'none', minPrice: 1000 },
  fields: [t('product_name', 'Tên sản phẩm', true), expiry(), storage()], children: FOOD };

// ============================ TẶNG MIỄN PHÍ (mới) ============================
const handover = () => s('handover', 'Cách nhận đồ', true, HANDOVER);
const GIVEAWAY: LeafSpec[] = [
  { slug: 'do-gia-dung-tang', name: 'Đồ gia dụng tặng', fields: [
    s('item_type', 'Loại đồ', true, ['Nội thất', 'Đồ điện gia dụng', 'Đồ dùng nhà bếp', 'Đồ trang trí', 'Khác']), n('quantity', 'Số lượng', true, { min: 1, max: 1000, integer: true }), t('brand', 'Thương hiệu'), handover(),
  ] },
  { slug: 'sach-quan-ao-tang', name: 'Sách & Quần áo tặng', fields: [
    s('item_type', 'Loại đồ', true, ['Sách', 'Truyện', 'Quần áo', 'Giày dép', 'Đồ trẻ em', 'Khác']), n('quantity', 'Số lượng', true, { min: 1, max: 1000, integer: true }), t('size_note', 'Kích cỡ / Đối tượng', false, { placeholder: 'VD: Size M, cho bé 2-3 tuổi' }), handover(),
  ] },
  { slug: 'thu-cung-cho-nuoi', name: 'Thú cưng tặng nuôi', config: { condition: 'none' }, fields: [
    s('pet_type', 'Loài', true, PET_TYPES), t('breed', 'Giống'), s('gender', 'Giới tính', false, ['Đực', 'Cái', 'Chưa xác định']), n('age_months', 'Tuổi', false, { min: 0, max: 360, unit: 'tháng', integer: true }),
    s('vaccinated', 'Tiêm phòng', false, ['Đã tiêm đủ', 'Đã tiêm một phần', 'Chưa tiêm']), s('reason', 'Lý do tặng', true, ['Không đủ điều kiện chăm sóc', 'Chuyển nhà', 'Nhặt được / Cứu hộ', 'Khác']),
    ta('requirements', 'Yêu cầu với người nhận nuôi'), handover(),
  ] },
];
export const GIVEAWAY_GROUP: GroupSpec = { slug: 'tang-mien-phi', name: 'Tặng miễn phí', order: 14, config: { priceModes: ['FREE'], condition: 'required' },
  fields: [t('item_name', 'Tên món đồ', true), n('quantity', 'Số lượng', true, { min: 1, max: 1000, integer: true }), handover()], children: GIVEAWAY };

// ============================ MẸ & BÉ ============================
const AGE_BABY = ['0 - 12 tháng', '1 - 3 tuổi', '3 - 6 tuổi', '6 - 12 tuổi', 'Trên 12 tuổi', 'Mọi lứa tuổi'];
const BABY: LeafSpec[] = [
  { slug: 'quan-ao-tre-em', name: 'Quần áo trẻ em', fields: [
    s('age_group', 'Độ tuổi', true, ['Sơ sinh (0 - 3 tháng)', '3 - 12 tháng', '1 - 3 tuổi', '3 - 6 tuổi', '6 - 12 tuổi', 'Trên 12 tuổi']), s('gender', 'Giới tính', false, ['Bé trai', 'Bé gái', 'Unisex']),
    t('size', 'Kích cỡ', true, { placeholder: 'VD: 6-9M, 2Y, size 110' }), s('garment_type', 'Loại trang phục', false, ['Áo', 'Quần', 'Váy / Đầm', 'Bộ quần áo', 'Đồ ngủ', 'Đồ sơ sinh', 'Khác']), t('brand', 'Thương hiệu'), t('material', 'Chất liệu', false, { maxLength: 100 }),
  ] },
  { slug: 'sua-do-an-cho-be', name: 'Sữa & đồ ăn cho bé', config: { condition: 'none' }, fields: [
    s('food_type', 'Loại sản phẩm', true, ['Sữa bột', 'Sữa nước', 'Bột / Cháo ăn dặm', 'Bánh / Snack', 'Thực phẩm bổ sung', 'Khác']), t('brand', 'Thương hiệu', true),
    s('age_group', 'Độ tuổi phù hợp', false, ['0 - 6 tháng', '6 - 12 tháng', '1 - 3 tuổi', 'Trên 3 tuổi']), n('net_weight', 'Khối lượng / Dung tích', false, { min: 1, max: 100000, unit: 'g / ml' }), d('expiry', 'Hạn sử dụng', true), s('packaging', 'Bao bì', false, ['Còn nguyên seal', 'Đã mở']),
  ] },
  { slug: 'xe-day-ghe-noi-cui', name: 'Xe đẩy, ghế, nôi, cũi', fields: [
    s('gear_type', 'Loại', true, ['Xe đẩy', 'Ghế ăn dặm', 'Nôi / Cũi', 'Ghế ô tô cho bé', 'Địu / Ba lô địu', 'Xe tập đi / Đu quay', 'Khác']), t('brand', 'Thương hiệu'), s('age_range', 'Độ tuổi phù hợp', false, AGE_BABY),
    n('max_weight_kg', 'Tải trọng tối đa', false, { min: 1, max: 100, unit: 'kg' }), b('foldable', 'Gấp gọn được'), y('year', 'Năm sản xuất', false, 2000),
  ] },
  { slug: 'do-choi-tre-em', name: 'Đồ chơi trẻ em', fields: [
    s('toy_type', 'Loại đồ chơi', true, ['Đồ chơi giáo dục', 'Xếp hình / Lego', 'Búp bê / Thú bông', 'Xe / Đồ chơi vận động', 'Đồ chơi điều khiển', 'Sách / Tranh cho bé', 'Khác']), s('age_range', 'Độ tuổi phù hợp', true, AGE_BABY),
    t('brand', 'Thương hiệu'), s('material', 'Chất liệu', false, ['Nhựa', 'Gỗ', 'Vải / Bông', 'Kim loại', 'Khác']), b('battery_required', 'Cần pin'),
  ] },
  { slug: 'do-cho-me', name: 'Đồ cho mẹ', fields: [
    s('mom_type', 'Loại sản phẩm', true, ['Đồ bầu', 'Máy hút sữa', 'Bình sữa / Phụ kiện cho bú', 'Đồ sau sinh', 'Túi / Balo bỉm', 'Khác']), t('brand', 'Thương hiệu'), t('size', 'Kích cỡ'), warranty(),
  ] },
  { slug: 'do-cho-be', name: 'Đồ dùng cho bé', fields: [
    s('baby_item', 'Loại đồ dùng', true, ['Bỉm / Tã', 'Bình sữa / Núm ti', 'Khăn / Chăn / Gối', 'Đồ tắm / Vệ sinh', 'Đồ dùng ăn uống', 'Khác']), t('brand', 'Thương hiệu'), s('age_range', 'Độ tuổi phù hợp', false, AGE_BABY),
  ] },
  { slug: 'me-be-khac', name: 'Mẹ & bé khác', fields: [t('item_name', 'Tên sản phẩm', true), s('age_range', 'Độ tuổi phù hợp', false, AGE_BABY), t('brand', 'Thương hiệu')] },
];
export const BABY_GROUP: GroupSpec = { slug: 'me-va-be', name: 'Mẹ & Bé', order: 10, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required', minPrice: 1000 },
  fields: [t('brand', 'Thương hiệu'), s('age_range', 'Độ tuổi phù hợp', false, AGE_BABY)], children: BABY };

// ============================ DỊCH VỤ ============================
const experience = () => n('experience_years', 'Kinh nghiệm', false, { min: 0, max: 60, unit: 'năm', integer: true });
const serviceArea = () => t('service_area', 'Khu vực phục vụ', true, { placeholder: 'VD: TP. Quy Nhơn và lân cận' });
const availability = () => s('availability', 'Thời gian phục vụ', false, ['Cả tuần', 'Giờ hành chính', 'Cuối tuần', 'Theo lịch hẹn']);
const atHome = () => b('at_home', 'Phục vụ tại nhà');
const scope = () => ta('scope', 'Phạm vi công việc');
const SERVICES: LeafSpec[] = [
  { slug: 'sua-chua', name: 'Sửa chữa', fields: [
    s('repair_type', 'Lĩnh vực sửa chữa', true, ['Điện thoại / Máy tính', 'Điện lạnh / Điều hòa', 'Điện nước', 'Xe máy / Ô tô', 'Đồ gia dụng', 'Nội thất / Xây sửa nhà', 'Khác']), serviceArea(), experience(),
    atHome(), n('warranty_months', 'Bảo hành dịch vụ', false, { min: 0, max: 120, unit: 'tháng', integer: true }), b('urgent', 'Nhận việc gấp'), availability(), scope(),
  ] },
  { slug: 'van-chuyen', name: 'Vận chuyển', fields: [
    s('transport_type', 'Loại vận chuyển', true, ['Xe tải chuyển nhà / Hàng hóa', 'Xe máy giao hàng', 'Xe du lịch / Hợp đồng', 'Chuyển phát nhanh', 'Vận chuyển quốc tế', 'Khác']),
    serviceArea(), t('vehicle', 'Phương tiện / Tải trọng', false, { placeholder: 'VD: Xe tải 1.5 tấn' }), b('insured', 'Có bảo hiểm hàng hóa'), experience(), availability(), scope(),
  ] },
  { slug: 'thiet-ke', name: 'Thiết kế', fields: [
    s('design_type', 'Lĩnh vực thiết kế', true, ['Logo / Nhận diện thương hiệu', 'Website / App', 'Đồ họa / Ấn phẩm', 'Nội thất / Kiến trúc', 'Video / Motion', 'Chỉnh sửa ảnh', 'Khác']),
    n('delivery_days', 'Thời gian hoàn thành', true, { min: 1, max: 365, unit: 'ngày', integer: true }), n('revisions', 'Số lần chỉnh sửa', false, { min: 0, max: 100, integer: true }),
    t('portfolio_url', 'Đường dẫn sản phẩm mẫu', false, { maxLength: 300 }), t('software', 'Phần mềm sử dụng'), b('remote', 'Làm việc từ xa'), experience(), scope(),
  ] },
  { slug: 'cho-thue', name: 'Cho thuê', config: { priceModes: ['FIXED', 'HOUR', 'DAY', 'MONTH', 'CONTACT'] }, fields: [
    s('rental_item', 'Loại đồ cho thuê', true, ['Xe / Phương tiện', 'Thiết bị quay chụp', 'Âm thanh / Ánh sáng', 'Dụng cụ / Máy móc', 'Bàn ghế / Lều / Sự kiện', 'Quần áo / Váy cưới', 'Khác']), t('item_name', 'Tên món đồ', true),
    n('quantity', 'Số lượng', false, { min: 1, max: 10000, integer: true }), money('deposit', 'Tiền đặt cọc', false, { max: 10_000_000_000 }), s('min_rental', 'Thời gian thuê tối thiểu', false, ['Theo giờ', 'Theo ngày', 'Theo tuần', 'Theo tháng']),
    b('delivery', 'Có giao tận nơi'), serviceArea(),
  ] },
  { slug: 'dich-vu-ca-nhan', name: 'Dịch vụ cá nhân', fields: [
    s('personal_type', 'Loại dịch vụ', true, ['Làm đẹp / Spa', 'Gia sư / Dạy kèm', 'Giúp việc / Trông trẻ', 'Chăm sóc người già', 'Chụp ảnh / Trang điểm', 'Massage', 'Khác']), serviceArea(), experience(), atHome(), availability(), t('certification', 'Chứng chỉ / Bằng cấp'), scope(),
  ] },
  { slug: 'dich-vu-doanh-nghiep', name: 'Dịch vụ doanh nghiệp', fields: [
    s('biz_type', 'Loại dịch vụ', true, ['Kế toán / Thuế', 'Pháp lý / Luật', 'Marketing / Quảng cáo', 'Tư vấn quản lý', 'Tuyển dụng / Nhân sự', 'In ấn / Bảng hiệu', 'Phần mềm / IT', 'Khác']), serviceArea(), experience(), b('invoice', 'Xuất hóa đơn VAT / Ký hợp đồng'), availability(), scope(),
  ] },
];
export const SERVICE_GROUP: GroupSpec = { slug: 'dich-vu', name: 'Dịch vụ', order: 11, config: { priceModes: ['FIXED', 'HOUR', 'DAY', 'MONTH', 'CONTACT'], condition: 'none', minPrice: 1000 },
  fields: [t('service_name', 'Tên dịch vụ', true), serviceArea(), scope()], children: SERVICES };

// ============================ HÀNG HÓA KHÁC ============================
const OTHER: LeafSpec[] = [
  { slug: 'hang-hoa-khac', name: 'Hàng hóa khác', fields: [t('item_type', 'Loại hàng hóa', true), t('brand', 'Thương hiệu'), t('model', 'Model'), t('material', 'Chất liệu', false, { maxLength: 100 }), dims(), n('weight_kg', 'Khối lượng', false, { min: 0.001, max: 100000, unit: 'kg' }), origin(), ta('details', 'Thông tin chi tiết')] },
];
export const OTHER_GROUP: GroupSpec = { slug: 'khac', name: 'Hàng hóa khác', order: 12, config: { priceModes: ['FIXED', 'CONTACT', 'FREE'], condition: 'required', minPrice: 1000 },
  fields: [t('brand', 'Thương hiệu'), t('model', 'Model'), origin()], children: OTHER };

export const CATALOG: GroupSpec[] = [TECH_GROUP, VEHICLE_GROUP, PROPERTY_GROUP, HOME_GROUP, FASHION_GROUP, SPORTS_GROUP, BOOKS_GROUP, MACHINERY_GROUP, COLLECT_GROUP, PETS_GROUP, FOOD_GROUP, GIVEAWAY_GROUP, BABY_GROUP, SERVICE_GROUP, OTHER_GROUP];
