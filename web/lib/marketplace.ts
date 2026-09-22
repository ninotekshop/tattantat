export interface SubCategorySpec {
  slug: string;
  name: string;
  icon: string;
}

export interface ParentCategorySpec {
  key: string;
  slug: string;
  label: string;
  short: string;
  icon: string;
  tone: string;
  subCategories: SubCategorySpec[];
}

export const LISTING_INTENTS = [
  { code: 'sell', name: 'Cần bán', description: 'Đăng bán sản phẩm, hàng hóa' },
  { code: 'rent', name: 'Cho thuê', description: 'Bất động sản, xe cộ, thiết bị cho thuê' },
  { code: 'giveaway', name: 'Tặng miễn phí', description: 'Đồ thừa, món quà cho cộng đồng (Giá = 0đ)' },
  { code: 'wanted_buy', name: 'Cần mua', description: 'Tìm mua sản phẩm, thiết bị mong muốn' },
  { code: 'wanted_rent', name: 'Cần thuê', description: 'Tìm thuê nhà, xe, thiết bị' },
  { code: 'service_offer', name: 'Cung cấp dịch vụ', description: 'Quảng bá dịch vụ sửa chữa, vận chuyển, v.v.' },
  { code: 'job_offer', name: 'Tuyển dụng / Việc làm', description: 'Đăng tin tuyển nhân sự, công việc' },
] as const;

export const CATEGORY_ENGINE_TAXONOMY: ParentCategorySpec[] = [
  {
    key: 'property',
    slug: 'nha-dat',
    label: 'Nhà đất',
    short: 'Nhà đất',
    icon: '/assets/category-icons/parent/nha-dat.png',
    tone: 'coral',
    subCategories: [
      { slug: 'can-ho-chung-cu', name: 'Căn hộ / Chung cư', icon: '/assets/category-icons/parent/nha-dat.png' },
      { slug: 'nha-o', name: 'Nhà ở', icon: '/assets/category-icons/parent/nha-dat.png' },
      { slug: 'dat', name: 'Đất', icon: '/assets/category-icons/parent/nha-dat.png' },
      { slug: 'phong-tro', name: 'Phòng trọ', icon: '/assets/category-icons/parent/nha-dat.png' },
      { slug: 'van-phong', name: 'Văn phòng', icon: '/assets/category-icons/parent/nha-dat.png' },
      { slug: 'mat-bang-kinh-doanh', name: 'Mặt bằng kinh doanh', icon: '/assets/category-icons/parent/nha-dat.png' },
      { slug: 'kho-xuang', name: 'Kho / Xưởng', icon: '/assets/category-icons/parent/nha-dat.png' },
      { slug: 'bds-khac', name: 'BĐS khác', icon: '/assets/category-icons/parent/nha-dat.png' },
    ]
  },
  {
    key: 'vehicles',
    slug: 'xe-co',
    label: 'Xe cộ',
    short: 'Xe cộ',
    icon: '/assets/category-icons/parent/xe-co.png',
    tone: 'purple',
    subCategories: [
      { slug: 'o-to', name: 'Ô tô', icon: '/assets/category-icons/parent/xe-co.png' },
      { slug: 'xe-may', name: 'Xe máy', icon: '/assets/category-icons/parent/xe-co.png' },
      { slug: 'xe-dap', name: 'Xe đạp', icon: '/assets/category-icons/parent/xe-co.png' },
      { slug: 'xe-tai-chuyen-dung', name: 'Xe tải & Xe chuyên dụng', icon: '/assets/category-icons/parent/xe-co.png' },
      { slug: 'phu-tung-phu-kien-xe', name: 'Phụ tùng & Phụ kiện xe', icon: '/assets/category-icons/parent/xe-co.png' },
      { slug: 'phuong-tien-khac', name: 'Phương tiện khác', icon: '/assets/category-icons/parent/xe-co.png' },
    ]
  },
  {
    key: 'technology',
    slug: 'do-cong-nghe',
    label: 'Đồ công nghệ',
    short: 'Công nghệ',
    icon: '/assets/category-icons/parent/do-cong-nghe.png',
    tone: 'violet',
    subCategories: [
      { slug: 'dien-thoai', name: 'Điện thoại', icon: '/assets/category-icons/parent/do-cong-nghe.png' },
      { slug: 'may-tinh-bang', name: 'Máy tính bảng', icon: '/assets/category-icons/parent/do-cong-nghe.png' },
      { slug: 'laptop', name: 'Laptop', icon: '/assets/category-icons/parent/do-cong-nghe.png' },
      { slug: 'may-tinh-de-ban', name: 'Máy tính để bàn', icon: '/assets/category-icons/parent/do-cong-nghe.png' },
      { slug: 'may-anh-may-quay', name: 'Máy ảnh & Máy quay', icon: '/assets/category-icons/parent/do-cong-nghe.png' },
      { slug: 'tv-am-thanh', name: 'TV & Âm thanh', icon: '/assets/category-icons/parent/do-cong-nghe.png' },
      { slug: 'thiet-bi-choi-game', name: 'Thiết bị chơi game', icon: '/assets/category-icons/parent/do-cong-nghe.png' },
      { slug: 'thiet-bi-deo-thong-minh', name: 'Thiết bị đeo thông minh', icon: '/assets/category-icons/parent/do-cong-nghe.png' },
      { slug: 'phu-kien-tech', name: 'Phụ kiện', icon: '/assets/category-icons/parent/do-cong-nghe.png' },
      { slug: 'linh-kien-tech', name: 'Linh kiện', icon: '/assets/category-icons/parent/do-cong-nghe.png' },
    ]
  },
  {
    key: 'home',
    slug: 'nha-cua-doi-song',
    label: 'Nhà cửa & Đời sống',
    short: 'Nhà cửa',
    icon: '/assets/category-icons/parent/nha-cua-doi-song.png',
    tone: 'amber',
    subCategories: [
      { slug: 'dien-lanh', name: 'Điện lạnh', icon: '/assets/category-icons/parent/nha-cua-doi-song.png' },
      { slug: 'bep-dien-nha-bep', name: 'Bếp & Đồ điện nhà bếp', icon: '/assets/category-icons/parent/nha-cua-doi-song.png' },
      { slug: 'dung-cu-nha-bep', name: 'Dụng cụ nhà bếp', icon: '/assets/category-icons/parent/nha-cua-doi-song.png' },
      { slug: 'noi-that', name: 'Nội thất', icon: '/assets/category-icons/parent/nha-cua-doi-song.png' },
      { slug: 'giuong-nem', name: 'Giường / Chăn / Ga / Gối / Nệm', icon: '/assets/category-icons/parent/nha-cua-doi-song.png' },
      { slug: 'thiet-bi-ve-sinh-nha-tam', name: 'Thiết bị vệ sinh & Nhà tắm', icon: '/assets/category-icons/parent/nha-cua-doi-song.png' },
      { slug: 'quat-thiet-bi-khong-khi', name: 'Quạt & Thiết bị không khí', icon: '/assets/category-icons/parent/nha-cua-doi-song.png' },
      { slug: 'den-chieu-sang', name: 'Đèn', icon: '/assets/category-icons/parent/nha-cua-doi-song.png' },
      { slug: 'trang-tri-nha-cua', name: 'Trang trí nhà cửa', icon: '/assets/category-icons/parent/nha-cua-doi-song.png' },
      { slug: 'cay-canh-san-vuon', name: 'Cây cảnh & Sân vườn', icon: '/assets/category-icons/parent/nha-cua-doi-song.png' },
      { slug: 'do-gia-dung-khac', name: 'Đồ gia dụng khác', icon: '/assets/category-icons/parent/nha-cua-doi-song.png' },
    ]
  },
  {
    key: 'fashion',
    slug: 'thoi-trang-ca-nhan',
    label: 'Thời trang & Cá nhân',
    short: 'Thời trang',
    icon: '/assets/category-icons/parent/thoi-trang-ca-nhan.png',
    tone: 'amber',
    subCategories: [
      { slug: 'quan-ao-nam', name: 'Quần áo nam', icon: '/assets/category-icons/parent/thoi-trang-ca-nhan.png' },
      { slug: 'quan-ao-nu', name: 'Quần áo nữ', icon: '/assets/category-icons/parent/thoi-trang-ca-nhan.png' },
      { slug: 'giay-dep', name: 'Giày dép', icon: '/assets/category-icons/parent/thoi-trang-ca-nhan.png' },
      { slug: 'tui-xach-balo-vali', name: 'Túi xách / Balo / Vali', icon: '/assets/category-icons/parent/thoi-trang-ca-nhan.png' },
      { slug: 'dong-ho', name: 'Đồng hồ', icon: '/assets/category-icons/parent/thoi-trang-ca-nhan.png' },
      { slug: 'trang-suc', name: 'Trang sức', icon: '/assets/category-icons/parent/thoi-trang-ca-nhan.png' },
      { slug: 'nuoc-hoa', name: 'Nước hoa', icon: '/assets/category-icons/parent/thoi-trang-ca-nhan.png' },
      { slug: 'my-pham', name: 'Mỹ phẩm', icon: '/assets/category-icons/parent/thoi-trang-ca-nhan.png' },
      { slug: 'phu-kien-thoi-trang', name: 'Phụ kiện thời trang', icon: '/assets/category-icons/parent/thoi-trang-ca-nhan.png' },
    ]
  },
  {
    key: 'mother_baby',
    slug: 'me-va-be',
    label: 'Mẹ & Bé',
    short: 'Mẹ & Bé',
    icon: '/assets/category-icons/parent/me-va-be.png',
    tone: 'coral',
    subCategories: [
      { slug: 'do-cho-be', name: 'Đồ cho bé', icon: '/assets/category-icons/parent/me-va-be.png' },
      { slug: 'do-cho-me', name: 'Đồ cho mẹ', icon: '/assets/category-icons/parent/me-va-be.png' },
      { slug: 'xe-day-ghe-noi-cui', name: 'Xe đẩy / Ghế / Nôi / Cũi', icon: '/assets/category-icons/parent/me-va-be.png' },
      { slug: 'do-choi-tre-em', name: 'Đồ chơi', icon: '/assets/category-icons/parent/me-va-be.png' },
      { slug: 'quan-ao-tre-em', name: 'Quần áo trẻ em', icon: '/assets/category-icons/parent/me-va-be.png' },
      { slug: 'sua-do-an-cho-be', name: 'Sữa & Đồ ăn cho bé', icon: '/assets/category-icons/parent/me-va-be.png' },
      { slug: 'me-be-khac', name: 'Khác', icon: '/assets/category-icons/parent/me-va-be.png' },
    ]
  },
  {
    key: 'sports',
    slug: 'the-thao-giai-tri',
    label: 'Thể thao & Giải trí',
    short: 'Thể thao',
    icon: '/assets/category-icons/parent/the-thao-giai-tri.png',
    tone: 'purple',
    subCategories: [
      { slug: 'the-thao', name: 'Thể thao', icon: '/assets/category-icons/parent/the-thao-giai-tri.png' },
      { slug: 'da-ngoai', name: 'Dã ngoại', icon: '/assets/category-icons/parent/the-thao-giai-tri.png' },
      { slug: 'nhac-cu', name: 'Nhạc cụ', icon: '/assets/category-icons/parent/the-thao-giai-tri.png' },
      { slug: 'sach-truyen-tap-chi', name: 'Sách / Truyện / Tạp chí', icon: '/assets/category-icons/parent/the-thao-giai-tri.png' },
      { slug: 'do-suu-tam', name: 'Đồ sưu tầm', icon: '/assets/category-icons/parent/the-thao-giai-tri.png' },
      { slug: 'game-phu-kien', name: 'Game & Phụ kiện', icon: '/assets/category-icons/parent/the-thao-giai-tri.png' },
      { slug: 've-xem-phim-sukiens', name: 'Vé', icon: '/assets/category-icons/parent/the-thao-giai-tri.png' },
      { slug: 'so-thich-khac', name: 'Sở thích khác', icon: '/assets/category-icons/parent/the-thao-giai-tri.png' },
    ]
  },
  {
    key: 'pets',
    slug: 'thu-cung',
    label: 'Thú cưng',
    short: 'Thú cưng',
    icon: '/assets/category-icons/parent/thu-cung.png',
    tone: 'coral',
    subCategories: [
      { slug: 'cho', name: 'Chó', icon: '/assets/category-icons/parent/thu-cung.png' },
      { slug: 'meo', name: 'Mèo', icon: '/assets/category-icons/parent/thu-cung.png' },
      { slug: 'chim', name: 'Chim', icon: '/assets/category-icons/parent/thu-cung.png' },
      { slug: 'ca-canh', name: 'Cá cảnh', icon: '/assets/category-icons/parent/thu-cung.png' },
      { slug: 'thu-cung-khac', name: 'Thú cưng khác', icon: '/assets/category-icons/parent/thu-cung.png' },
      { slug: 'thuc-an-thu-cung', name: 'Thức ăn', icon: '/assets/category-icons/parent/thu-cung.png' },
      { slug: 'phu-kien-thu-cung', name: 'Phụ kiện', icon: '/assets/category-icons/parent/thu-cung.png' },
      { slug: 'dich-vu-thu-cung', name: 'Dịch vụ thú cưng', icon: '/assets/category-icons/parent/thu-cung.png' },
    ]
  },
  {
    key: 'jobs',
    slug: 'viec-lam',
    label: 'Việc làm',
    short: 'Việc làm',
    icon: '/assets/category-icons/parent/viec-lam.png',
    tone: 'blue',
    subCategories: [
      { slug: 'ban-hang-viec', name: 'Bán hàng', icon: '/assets/category-icons/parent/viec-lam.png' },
      { slug: 'kinh-doanh-viec', name: 'Kinh doanh', icon: '/assets/category-icons/parent/viec-lam.png' },
      { slug: 'van-phong-viec', name: 'Văn phòng', icon: '/assets/category-icons/parent/viec-lam.png' },
      { slug: 'ke-toan-viec', name: 'Kế toán', icon: '/assets/category-icons/parent/viec-lam.png' },
      { slug: 'it-cong-nghe-viec', name: 'IT / Công nghệ', icon: '/assets/category-icons/parent/viec-lam.png' },
      { slug: 'marketing-viec', name: 'Marketing', icon: '/assets/category-icons/parent/viec-lam.png' },
      { slug: 'thiet-ke-viec', name: 'Thiết kế', icon: '/assets/category-icons/parent/viec-lam.png' },
      { slug: 'nha-hang-khach-san-viec', name: 'Nhà hàng / Khách sạn', icon: '/assets/category-icons/parent/viec-lam.png' },
      { slug: 'giao-hang-tai-xe-viec', name: 'Giao hàng / Tài xế', icon: '/assets/category-icons/parent/viec-lam.png' },
      { slug: 'lao-dong-pho-thong-viec', name: 'Lao động phổ thông', icon: '/assets/category-icons/parent/viec-lam.png' },
      { slug: 'ky-thuat-viec', name: 'Kỹ thuật', icon: '/assets/category-icons/parent/viec-lam.png' },
      { slug: 'viec-lam-khac', name: 'Việc làm khác', icon: '/assets/category-icons/parent/viec-lam.png' },
    ]
  },
  {
    key: 'services',
    slug: 'dich-vu',
    label: 'Dịch vụ',
    short: 'Dịch vụ',
    icon: '/assets/category-icons/parent/dich-vu.png',
    tone: 'cyan',
    subCategories: [
      { slug: 'sua-chua-dich-vu', name: 'Sửa chữa', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 'van-chuyen-dich-vu', name: 'Vận chuyển', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 'thue-xe-dich-vu', name: 'Thuê xe', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 'du-lich-dich-vu', name: 'Du lịch', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 'luu-tru-dich-vu', name: 'Lưu trú', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 'gia-dinh-dich-vu', name: 'Gia đình', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 've-sinh-dich-vu', name: 'Vệ sinh', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 'lam-dep-dich-vu', name: 'Làm đẹp', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 'chup-anh-video-dich-vu', name: 'Chụp ảnh / Video', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 'thiet-ke-cong-nghe-dich-vu', name: 'Thiết kế / Công nghệ', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 'giao-duc-dich-vu', name: 'Giáo dục', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 'to-chuc-su-kien-dich-vu', name: 'Tổ chức sự kiện', icon: '/assets/category-icons/parent/dich-vu.png' },
      { slug: 'dich-vu-khac', name: 'Dịch vụ khác', icon: '/assets/category-icons/parent/dich-vu.png' },
    ]
  },
  {
    key: 'food',
    slug: 'thuc-pham',
    label: 'Thực phẩm',
    short: 'Thực phẩm',
    icon: '/assets/category-icons/parent/thuc-pham.png',
    tone: 'amber',
    subCategories: [
      { slug: 'do-an', name: 'Đồ ăn', icon: '/assets/category-icons/parent/thuc-pham.png' },
      { slug: 'do-uong', name: 'Đồ uống', icon: '/assets/category-icons/parent/thuc-pham.png' },
      { slug: 'dac-san', name: 'Đặc sản', icon: '/assets/category-icons/parent/thuc-pham.png' },
      { slug: 'rau-cu-trai-cay', name: 'Rau củ / Trái cây', icon: '/assets/category-icons/parent/thuc-pham.png' },
      { slug: 'thuc-pham-tuoi-song', name: 'Thực phẩm tươi sống', icon: '/assets/category-icons/parent/thuc-pham.png' },
      { slug: 'thuc-pham-kho', name: 'Thực phẩm khô', icon: '/assets/category-icons/parent/thuc-pham.png' },
      { slug: 'do-handmade', name: 'Đồ handmade', icon: '/assets/category-icons/parent/thuc-pham.png' },
      { slug: 'thuc-pham-khac', name: 'Khác', icon: '/assets/category-icons/parent/thuc-pham.png' },
    ]
  },
  {
    key: 'machinery',
    slug: 'may-moc-cong-nghiep',
    label: 'Máy móc & Công nghiệp',
    short: 'Máy móc',
    icon: '/assets/category-icons/parent/may-moc-cong-nghiep.png',
    tone: 'blue',
    subCategories: [
      { slug: 'may-moc-cong-nghiep', name: 'Máy móc công nghiệp', icon: '/assets/category-icons/parent/may-moc-cong-nghiep.png' },
      { slug: 'may-moc-nong-nghiep', name: 'Máy móc nông nghiệp', icon: '/assets/category-icons/parent/may-moc-cong-nghiep.png' },
      { slug: 'thiet-bi-xay-dung', name: 'Thiết bị xây dựng', icon: '/assets/category-icons/parent/may-moc-cong-nghiep.png' },
      { slug: 'dung-cu-co-khi', name: 'Dụng cụ cơ khí', icon: '/assets/category-icons/parent/may-moc-cong-nghiep.png' },
      { slug: 'thiet-bi-nha-hang', name: 'Thiết bị nhà hàng', icon: '/assets/category-icons/parent/may-moc-cong-nghiep.png' },
      { slug: 'thiet-bi-cua-hang', name: 'Thiết bị cửa hàng', icon: '/assets/category-icons/parent/may-moc-cong-nghiep.png' },
      { slug: 'thiet-bi-van-phong', name: 'Thiết bị văn phòng', icon: '/assets/category-icons/parent/may-moc-cong-nghiep.png' },
      { slug: 'nguyen-vat-lieu', name: 'Nguyên vật liệu', icon: '/assets/category-icons/parent/may-moc-cong-nghiep.png' },
      { slug: 'giong-cay-trong', name: 'Giống cây trồng', icon: '/assets/category-icons/parent/may-moc-cong-nghiep.png' },
      { slug: 'may-moc-khac', name: 'Khác', icon: '/assets/category-icons/parent/may-moc-cong-nghiep.png' },
    ]
  },
  {
    key: 'giveaway',
    slug: 'tang-mien-phi',
    label: 'Tặng miễn phí',
    short: 'Tặng miễn phí',
    icon: '/assets/category-icons/parent/tang-mien-phi.png',
    tone: 'coral',
    subCategories: [
      { slug: 'do-gia-dung-tang', name: 'Đồ gia dụng tặng', icon: '/assets/category-icons/parent/tang-mien-phi.png' },
      { slug: 'sach-quan-ao-tang', name: 'Sách & Quần áo tặng', icon: '/assets/category-icons/parent/tang-mien-phi.png' },
      { slug: 'thu-cung-cho-nuoi', name: 'Thú cưng tặng nuôi', icon: '/assets/category-icons/parent/tang-mien-phi.png' },
    ]
  },
  {
    key: 'other',
    slug: 'khac',
    label: 'Khác',
    short: 'Khác',
    icon: '/assets/category-icons/parent/khac.png',
    tone: 'violet',
    subCategories: [
      { slug: 'san-pham-khac', name: 'Sản phẩm khác', icon: '/assets/category-icons/parent/khac.png' },
    ]
  }
];

export const categoryGroups = CATEGORY_ENGINE_TAXONOMY.map(cat => ({
  key: cat.key,
  label: cat.label,
  short: cat.short,
  slugs: [cat.slug, ...cat.subCategories.map(s => s.slug)],
  icon: cat.icon,
  tone: cat.tone
}));

export const categoryHref = (key: string) => '/categories?cat=' + encodeURIComponent(key);

export function formatVnd(value: string) {
  const match = /^(\d+)(?:\.0+)?$/.exec(value);
  return match ? new Intl.NumberFormat('vi-VN').format(BigInt(match[1])) + 'đ' : 'Giá đang cập nhật';
}

export function resolveCategoryIds(groupKey: string, categories: { id: number | string; slug: string }[]) {
  const group = categoryGroups.find(item => item.key === groupKey);
  if (!group) return [];
  return [...new Set(categories
    .filter(category => (group.slugs as readonly string[]).includes(category.slug))
    .map(category => Number(category.id))
    .filter(id => Number.isSafeInteger(id) && id > 0))];
}

export const shoppingGuides = [
  { title: '5 cách kiểm tra iPhone cũ trước khi mua', art: 'phone', category: 'KINH NGHIỆM MUA SẮM', body: 'Kiểm tra ngoại hình và màn hình. Thử camera, loa, micro và các phím bấm. Xem tình trạng pin trong Cài đặt. Đề nghị người bán đăng xuất tài khoản iCloud và tắt Tìm iPhone trước khi bàn giao. Chỉ xác nhận nhận hàng sau khi đã kiểm tra máy trực tiếp.' },
  { title: 'Kinh nghiệm mua xe máy cũ an toàn', art: 'scooter', category: 'MUA BÁN AN TOÀN', body: 'Hẹn xem xe tại nơi công cộng. Kiểm tra số khung, số máy và đối chiếu giấy tờ xe. Thử phanh, đèn và động cơ cùng người có kinh nghiệm. Không chuyển tiền đặt cọc khi chưa kiểm tra xe và thông tin người bán.' },
  { title: 'Cách đăng tin bất động sản hiệu quả', art: 'house', category: 'MẸO ĐĂNG TIN', body: 'Chụp ảnh rõ ràng, đủ ánh sáng và đúng hiện trạng. Ghi chính xác vị trí, diện tích, giá và các chi phí liên quan. Mô tả thông tin giấy tờ bạn có thể cung cấp. Không công khai hình ảnh chứa thông tin cá nhân nhạy cảm.' },
  { title: 'Những món đồ gia dụng nên mua thanh lý', art: 'laptop', category: 'SỐNG TIẾT KIỆM', body: 'Bàn, ghế, kệ và các món đồ bền dễ kiểm tra là lựa chọn phù hợp khi mua thanh lý. Với đồ điện, hãy yêu cầu chạy thử và kiểm tra dây nguồn. Hỏi rõ kích thước, tình trạng và phương án vận chuyển trước khi mua.' },
] as const;
