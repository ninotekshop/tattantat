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
      { slug: 'can-ho-chung-cu', name: 'Căn hộ / Chung cư', icon: '/assets/category-icons/sub/nha-dat/can-ho-chung-cu.png' },
      { slug: 'nha-o', name: 'Nhà ở', icon: '/assets/category-icons/sub/nha-dat/nha-o.png' },
      { slug: 'dat', name: 'Đất', icon: '/assets/category-icons/sub/nha-dat/dat.png' },
      { slug: 'phong-tro', name: 'Phòng trọ', icon: '/assets/category-icons/sub/nha-dat/phong-tro.png' },
      { slug: 'van-phong', name: 'Văn phòng', icon: '/assets/category-icons/sub/nha-dat/van-phong.png' },
      { slug: 'mat-bang-kinh-doanh', name: 'Mặt bằng kinh doanh', icon: '/assets/category-icons/sub/nha-dat/mat-bang-kinh-doanh.png' },
      { slug: 'kho-xuang', name: 'Kho / Xưởng', icon: '/assets/category-icons/sub/nha-dat/kho-xuang.png' },
      { slug: 'bds-khac', name: 'BĐS khác', icon: '/assets/category-icons/sub/nha-dat/bds-khac.png' },
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
      { slug: 'o-to', name: 'Ô tô', icon: '/assets/category-icons/sub/xe-co/o-to.png' },
      { slug: 'xe-may', name: 'Xe máy', icon: '/assets/category-icons/sub/xe-co/xe-may.png' },
      { slug: 'xe-dap', name: 'Xe đạp', icon: '/assets/category-icons/sub/xe-co/xe-dap.png' },
      { slug: 'xe-tai-chuyen-dung', name: 'Xe tải & Xe chuyên dụng', icon: '/assets/category-icons/sub/xe-co/xe-tai-chuyen-dung.png' },
      { slug: 'phu-tung-phu-kien-xe', name: 'Phụ tùng & Phụ kiện xe', icon: '/assets/category-icons/sub/xe-co/phu-tung-phu-kien-xe.png' },
      { slug: 'phuong-tien-khac', name: 'Phương tiện khác', icon: '/assets/category-icons/sub/xe-co/phuong-tien-khac.png' },
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
      { slug: 'dien-thoai', name: 'Điện thoại', icon: '/assets/category-icons/sub/do-cong-nghe/dien-thoai.png' },
      { slug: 'may-tinh-bang', name: 'Máy tính bảng', icon: '/assets/category-icons/sub/do-cong-nghe/may-tinh-bang.png' },
      { slug: 'laptop', name: 'Laptop', icon: '/assets/category-icons/sub/do-cong-nghe/laptop.png' },
      { slug: 'may-tinh-de-ban', name: 'Máy tính để bàn', icon: '/assets/category-icons/sub/do-cong-nghe/may-tinh-de-ban.png' },
      { slug: 'may-anh-may-quay', name: 'Máy ảnh & Máy quay', icon: '/assets/category-icons/sub/do-cong-nghe/may-anh-may-quay.png' },
      { slug: 'tv-am-thanh', name: 'TV & Âm thanh', icon: '/assets/category-icons/sub/do-cong-nghe/tv-am-thanh.png' },
      { slug: 'thiet-bi-choi-game', name: 'Thiết bị chơi game', icon: '/assets/category-icons/sub/do-cong-nghe/thiet-bi-choi-game.png' },
      { slug: 'thiet-bi-deo-thong-minh', name: 'Thiết bị đeo thông minh', icon: '/assets/category-icons/sub/do-cong-nghe/thiet-bi-deo-thong-minh.png' },
      { slug: 'phu-kien-tech', name: 'Phụ kiện', icon: '/assets/category-icons/sub/do-cong-nghe/phu-kien-tech.png' },
      { slug: 'linh-kien-tech', name: 'Linh kiện', icon: '/assets/category-icons/sub/do-cong-nghe/linh-kien-tech.png' },
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
      { slug: 'dien-lanh', name: 'Điện lạnh', icon: '/assets/category-icons/sub/nha-cua-doi-song/dien-lanh.png' },
      { slug: 'bep-dien-nha-bep', name: 'Bếp & Đồ điện nhà bếp', icon: '/assets/category-icons/sub/nha-cua-doi-song/bep-dien-nha-bep.png' },
      { slug: 'dung-cu-nha-bep', name: 'Dụng cụ nhà bếp', icon: '/assets/category-icons/sub/nha-cua-doi-song/dung-cu-nha-bep.png' },
      { slug: 'noi-that', name: 'Nội thất', icon: '/assets/category-icons/sub/nha-cua-doi-song/noi-that.png' },
      { slug: 'giuong-nem', name: 'Giường / Chăn / Ga / Gối / Nệm', icon: '/assets/category-icons/sub/nha-cua-doi-song/giuong-nem.png' },
      { slug: 'thiet-bi-ve-sinh-nha-tam', name: 'Thiết bị vệ sinh & Nhà tắm', icon: '/assets/category-icons/sub/nha-cua-doi-song/thiet-bi-ve-sinh-nha-tam.png' },
      { slug: 'quat-thiet-bi-khong-khi', name: 'Quạt & Thiết bị không khí', icon: '/assets/category-icons/sub/nha-cua-doi-song/quat-thiet-bi-khong-khi.png' },
      { slug: 'den-chieu-sang', name: 'Đèn', icon: '/assets/category-icons/sub/nha-cua-doi-song/den-chieu-sang.png' },
      { slug: 'trang-tri-nha-cua', name: 'Trang trí nhà cửa', icon: '/assets/category-icons/sub/nha-cua-doi-song/trang-tri-nha-cua.png' },
      { slug: 'cay-canh-san-vuon', name: 'Cây cảnh & Sân vườn', icon: '/assets/category-icons/sub/nha-cua-doi-song/cay-canh-san-vuon.png' },
      { slug: 'do-gia-dung-khac', name: 'Đồ gia dụng khác', icon: '/assets/category-icons/sub/nha-cua-doi-song/do-gia-dung-khac.png' },
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
      { slug: 'quan-ao-nam', name: 'Quần áo nam', icon: '/assets/category-icons/sub/thoi-trang-ca-nhan/quan-ao-nam.png' },
      { slug: 'quan-ao-nu', name: 'Quần áo nữ', icon: '/assets/category-icons/sub/thoi-trang-ca-nhan/quan-ao-nu.png' },
      { slug: 'giay-dep', name: 'Giày dép', icon: '/assets/category-icons/sub/thoi-trang-ca-nhan/giay-dep.png' },
      { slug: 'tui-xach-balo-vali', name: 'Túi xách / Balo / Vali', icon: '/assets/category-icons/sub/thoi-trang-ca-nhan/tui-xach-balo-vali.png' },
      { slug: 'dong-ho', name: 'Đồng hồ', icon: '/assets/category-icons/sub/thoi-trang-ca-nhan/dong-ho.png' },
      { slug: 'trang-suc', name: 'Trang sức', icon: '/assets/category-icons/sub/thoi-trang-ca-nhan/trang-suc.png' },
      { slug: 'nuoc-hoa', name: 'Nước hoa', icon: '/assets/category-icons/sub/thoi-trang-ca-nhan/nuoc-hoa.png' },
      { slug: 'my-pham', name: 'Mỹ phẩm', icon: '/assets/category-icons/sub/thoi-trang-ca-nhan/my-pham.png' },
      { slug: 'phu-kien-thoi-trang', name: 'Phụ kiện thời trang', icon: '/assets/category-icons/sub/thoi-trang-ca-nhan/phu-kien-thoi-trang.png' },
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
      { slug: 'do-cho-be', name: 'Đồ cho bé', icon: '/assets/category-icons/sub/me-va-be/do-cho-be.png' },
      { slug: 'do-cho-me', name: 'Đồ cho mẹ', icon: '/assets/category-icons/sub/me-va-be/do-cho-me.png' },
      { slug: 'xe-day-ghe-noi-cui', name: 'Xe đẩy / Ghế / Nôi / Cũi', icon: '/assets/category-icons/sub/me-va-be/xe-day-ghe-noi-cui.png' },
      { slug: 'do-choi-tre-em', name: 'Đồ chơi', icon: '/assets/category-icons/sub/me-va-be/do-choi-tre-em.png' },
      { slug: 'quan-ao-tre-em', name: 'Quần áo trẻ em', icon: '/assets/category-icons/sub/me-va-be/quan-ao-tre-em.png' },
      { slug: 'sua-do-an-cho-be', name: 'Sữa & Đồ ăn cho bé', icon: '/assets/category-icons/sub/me-va-be/sua-do-an-cho-be.png' },
      { slug: 'me-be-khac', name: 'Khác', icon: '/assets/category-icons/sub/me-va-be/me-be-khac.png' },
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
      { slug: 'the-thao', name: 'Thể thao', icon: '/assets/category-icons/sub/the-thao-giai-tri/the-thao.png' },
      { slug: 'da-ngoai', name: 'Dã ngoại', icon: '/assets/category-icons/sub/the-thao-giai-tri/da-ngoai.png' },
      { slug: 'nhac-cu', name: 'Nhạc cụ', icon: '/assets/category-icons/sub/the-thao-giai-tri/nhac-cu.png' },
      { slug: 'sach-truyen-tap-chi', name: 'Sách / Truyện / Tạp chí', icon: '/assets/category-icons/sub/the-thao-giai-tri/sach-truyen-tap-chi.png' },
      { slug: 'do-suu-tam', name: 'Đồ sưu tầm', icon: '/assets/category-icons/sub/the-thao-giai-tri/do-suu-tam.png' },
      { slug: 'game-phu-kien', name: 'Game & Phụ kiện', icon: '/assets/category-icons/sub/the-thao-giai-tri/game-phu-kien.png' },
      { slug: 've-xem-phim-sukiens', name: 'Vé', icon: '/assets/category-icons/sub/the-thao-giai-tri/ve-xem-phim-sukiens.png' },
      { slug: 'so-thich-khac', name: 'Sở thích khác', icon: '/assets/category-icons/sub/the-thao-giai-tri/so-thich-khac.png' },
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
      { slug: 'cho', name: 'Chó', icon: '/assets/category-icons/sub/thu-cung/cho.png' },
      { slug: 'meo', name: 'Mèo', icon: '/assets/category-icons/sub/thu-cung/meo.png' },
      { slug: 'chim', name: 'Chim', icon: '/assets/category-icons/sub/thu-cung/chim.png' },
      { slug: 'ca-canh', name: 'Cá cảnh', icon: '/assets/category-icons/sub/thu-cung/ca-canh.png' },
      { slug: 'thu-cung-khac', name: 'Thú cưng khác', icon: '/assets/category-icons/sub/thu-cung/thu-cung-khac.png' },
      { slug: 'thuc-an-thu-cung', name: 'Thức ăn', icon: '/assets/category-icons/sub/thu-cung/thuc-an-thu-cung.png' },
      { slug: 'phu-kien-thu-cung', name: 'Phụ kiện', icon: '/assets/category-icons/sub/thu-cung/phu-kien-thu-cung.png' },
      { slug: 'dich-vu-thu-cung', name: 'Dịch vụ thú cưng', icon: '/assets/category-icons/sub/thu-cung/dich-vu-thu-cung.png' },
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
      { slug: 'ban-hang-viec', name: 'Bán hàng', icon: '/assets/category-icons/sub/viec-lam/ban-hang-viec.png' },
      { slug: 'kinh-doanh-viec', name: 'Kinh doanh', icon: '/assets/category-icons/sub/viec-lam/kinh-doanh-viec.png' },
      { slug: 'van-phong-viec', name: 'Văn phòng', icon: '/assets/category-icons/sub/viec-lam/van-phong-viec.png' },
      { slug: 'ke-toan-viec', name: 'Kế toán', icon: '/assets/category-icons/sub/viec-lam/ke-toan-viec.png' },
      { slug: 'it-cong-nghe-viec', name: 'IT / Công nghệ', icon: '/assets/category-icons/sub/viec-lam/it-cong-nghe-viec.png' },
      { slug: 'marketing-viec', name: 'Marketing', icon: '/assets/category-icons/sub/viec-lam/marketing-viec.png' },
      { slug: 'thiet-ke-viec', name: 'Thiết kế', icon: '/assets/category-icons/sub/viec-lam/thiet-ke-viec.png' },
      { slug: 'nha-hang-khach-san-viec', name: 'Nhà hàng / Khách sạn', icon: '/assets/category-icons/sub/viec-lam/nha-hang-khach-san-viec.png' },
      { slug: 'giao-hang-tai-xe-viec', name: 'Giao hàng / Tài xế', icon: '/assets/category-icons/sub/viec-lam/giao-hang-tai-xe-viec.png' },
      { slug: 'lao-dong-pho-thong-viec', name: 'Lao động phổ thông', icon: '/assets/category-icons/sub/viec-lam/lao-dong-pho-thong-viec.png' },
      { slug: 'ky-thuat-viec', name: 'Kỹ thuật', icon: '/assets/category-icons/sub/viec-lam/ky-thuat-viec.png' },
      { slug: 'viec-lam-khac', name: 'Việc làm khác', icon: '/assets/category-icons/sub/viec-lam/viec-lam-khac.png' },
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
      { slug: 'sua-chua-dich-vu', name: 'Sửa chữa', icon: '/assets/category-icons/sub/dich-vu/sua-chua-dich-vu.png' },
      { slug: 'van-chuyen-dich-vu', name: 'Vận chuyển', icon: '/assets/category-icons/sub/dich-vu/van-chuyen-dich-vu.png' },
      { slug: 'thue-xe-dich-vu', name: 'Thuê xe', icon: '/assets/category-icons/sub/dich-vu/thue-xe-dich-vu.png' },
      { slug: 'du-lich-dich-vu', name: 'Du lịch', icon: '/assets/category-icons/sub/dich-vu/du-lich-dich-vu.png' },
      { slug: 'luu-tru-dich-vu', name: 'Lưu trú', icon: '/assets/category-icons/sub/dich-vu/luu-tru-dich-vu.png' },
      { slug: 'gia-dinh-dich-vu', name: 'Gia đình', icon: '/assets/category-icons/sub/dich-vu/gia-dinh-dich-vu.png' },
      { slug: 've-sinh-dich-vu', name: 'Vệ sinh', icon: '/assets/category-icons/sub/dich-vu/ve-sinh-dich-vu.png' },
      { slug: 'lam-dep-dich-vu', name: 'Làm đẹp', icon: '/assets/category-icons/sub/dich-vu/lam-dep-dich-vu.png' },
      { slug: 'chup-anh-video-dich-vu', name: 'Chụp ảnh / Video', icon: '/assets/category-icons/sub/dich-vu/chup-anh-video-dich-vu.png' },
      { slug: 'thiet-ke-cong-nghe-dich-vu', name: 'Thiết kế / Công nghệ', icon: '/assets/category-icons/sub/dich-vu/thiet-ke-cong-nghe-dich-vu.png' },
      { slug: 'giao-duc-dich-vu', name: 'Giáo dục', icon: '/assets/category-icons/sub/dich-vu/giao-duc-dich-vu.png' },
      { slug: 'to-chuc-su-kien-dich-vu', name: 'Tổ chức sự kiện', icon: '/assets/category-icons/sub/dich-vu/to-chuc-su-kien-dich-vu.png' },
      { slug: 'dich-vu-khac', name: 'Dịch vụ khác', icon: '/assets/category-icons/sub/dich-vu/dich-vu-khac.png' },
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
      { slug: 'do-an', name: 'Đồ ăn', icon: '/assets/category-icons/sub/thuc-pham/do-an.png' },
      { slug: 'do-uong', name: 'Đồ uống', icon: '/assets/category-icons/sub/thuc-pham/do-uong.png' },
      { slug: 'dac-san', name: 'Đặc sản', icon: '/assets/category-icons/sub/thuc-pham/dac-san.png' },
      { slug: 'rau-cu-trai-cay', name: 'Rau củ / Trái cây', icon: '/assets/category-icons/sub/thuc-pham/rau-cu-trai-cay.png' },
      { slug: 'thuc-pham-tuoi-song', name: 'Thực phẩm tươi sống', icon: '/assets/category-icons/sub/thuc-pham/thuc-pham-tuoi-song.png' },
      { slug: 'thuc-pham-kho', name: 'Thực phẩm khô', icon: '/assets/category-icons/sub/thuc-pham/thuc-pham-kho.png' },
      { slug: 'do-handmade', name: 'Đồ handmade', icon: '/assets/category-icons/sub/thuc-pham/do-handmade.png' },
      { slug: 'thuc-pham-khac', name: 'Khác', icon: '/assets/category-icons/sub/thuc-pham/thuc-pham-khac.png' },
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
      { slug: 'may-moc-cong-nghiep', name: 'Máy móc công nghiệp', icon: '/assets/category-icons/sub/may-moc-cong-nghiep/may-moc-cong-nghiep.png' },
      { slug: 'may-moc-nong-nghiep', name: 'Máy móc nông nghiệp', icon: '/assets/category-icons/sub/may-moc-cong-nghiep/may-moc-nong-nghiep.png' },
      { slug: 'thiet-bi-xay-dung', name: 'Thiết bị xây dựng', icon: '/assets/category-icons/sub/may-moc-cong-nghiep/thiet-bi-xay-dung.png' },
      { slug: 'dung-cu-co-khi', name: 'Dụng cụ cơ khí', icon: '/assets/category-icons/sub/may-moc-cong-nghiep/dung-cu-co-khi.png' },
      { slug: 'thiet-bi-nha-hang', name: 'Thiết bị nhà hàng', icon: '/assets/category-icons/sub/may-moc-cong-nghiep/thiet-bi-nha-hang.png' },
      { slug: 'thiet-bi-cua-hang', name: 'Thiết bị cửa hàng', icon: '/assets/category-icons/sub/may-moc-cong-nghiep/thiet-bi-cua-hang.png' },
      { slug: 'thiet-bi-van-phong', name: 'Thiết bị văn phòng', icon: '/assets/category-icons/sub/may-moc-cong-nghiep/thiet-bi-van-phong.png' },
      { slug: 'nguyen-vat-lieu', name: 'Nguyên vật liệu', icon: '/assets/category-icons/sub/may-moc-cong-nghiep/nguyen-vat-lieu.png' },
      { slug: 'giong-cay-trong', name: 'Giống cây trồng', icon: '/assets/category-icons/sub/may-moc-cong-nghiep/giong-cay-trong.png' },
      { slug: 'may-moc-khac', name: 'Khác', icon: '/assets/category-icons/sub/may-moc-cong-nghiep/may-moc-khac.png' },
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
      { slug: 'do-gia-dung-tang', name: 'Đồ gia dụng tặng', icon: '/assets/category-icons/sub/tang-mien-phi/do-gia-dung-tang.png' },
      { slug: 'sach-quan-ao-tang', name: 'Sách & Quần áo tặng', icon: '/assets/category-icons/sub/tang-mien-phi/sach-quan-ao-tang.png' },
      { slug: 'thu-cung-cho-nuoi', name: 'Thú cưng tặng nuôi', icon: '/assets/category-icons/sub/tang-mien-phi/thu-cung-cho-nuoi.png' },
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
      { slug: 'san-pham-khac', name: 'Sản phẩm khác', icon: '/assets/category-icons/sub/khac/san-pham-khac.png' },
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

export function getCategoryPlaceholders(parentKeyOrSlug?: string, categoryName?: string, intentCode?: string) {
  const key = (parentKeyOrSlug || categoryName || '').toLowerCase();
  const isRent = intentCode === 'rent' || key.includes('thuê') || key.includes('rent');

  if (key.includes('property') || key.includes('nha-dat') || key.includes('nhà') || key.includes('đất') || key.includes('bất động sản') || key.includes('căn hộ') || key.includes('phòng trọ')) {
    if (isRent) {
      return {
        title: 'VD: Cho thuê căn hộ 2PN 70m² KĐT An Phú, full nội thất, view đẹp',
        description: 'Mô tả vị trí, diện tích (m²), số phòng ngủ/tắm, tình trạng nội thất, tiện ích xung quanh (trường học, siêu thị), giá thuê và chi phí dịch vụ...'
      };
    }
    return {
      title: 'VD: Bán nhà 3 tầng mặt tiền đường Nguyễn Huệ, 85m², sổ hồng chính chủ',
      description: 'Mô tả chi tiết vị trí, diện tích (m²), số tầng/phòng, giấy tờ pháp lý (sổ hồng/sổ đỏ), hướng nhà, giá bán và tiện ích xung quanh...'
    };
  }

  if (key.includes('vehicle') || key.includes('xe-co') || key.includes('xe') || key.includes('ô tô') || key.includes('xe máy')) {
    return {
      title: 'VD: Xe máy Honda Vision 2022 chính chủ, odo 12.000 km, biển TP.HCM',
      description: 'Mô tả tình trạng máy móc, số km đã đi (odo), năm đăng ký, lịch sử bảo dưỡng, giấy tờ xe chính chủ và phụ kiện kèm theo...'
    };
  }

  if (key.includes('job') || key.includes('viec-lam') || key.includes('việc làm') || key.includes('tuyển dụng')) {
    return {
      title: 'VD: Tuyển 03 Nhân viên Tư vấn Bán hàng Thu nhập 10-15 triệu/tháng',
      description: 'Mô tả chi tiết vị trí công việc, địa điểm, thời gian làm việc, yêu cầu độ tuổi/kinh nghiệm, mức lương, phụ cấp và cách nộp hồ sơ...'
    };
  }

  if (key.includes('service') || key.includes('dich-vu') || key.includes('dịch vụ')) {
    return {
      title: 'VD: Dịch vụ sửa chữa điện nước, điện lạnh tại nhà 24/7 giá tốt',
      description: 'Mô tả chi tiết các hạng mục dịch vụ cung cấp, quy trình phục vụ, bảng giá tham khảo, khu vực hỗ trợ và cam kết bảo hành...'
    };
  }

  if (key.includes('home') || key.includes('nha-cua') || key.includes('gia dụng') || key.includes('nội thất')) {
    return {
      title: 'VD: Tủ lạnh LG Inverter 315 lít còn bảo hành chính hãng, mới 95%',
      description: 'Mô tả thương hiệu, kích thước/dung tích, thời gian sử dụng, tình trạng hoạt động thực tế, phụ kiện đi kèm và lý do thanh lý...'
    };
  }

  if (key.includes('mother_baby') || key.includes('me-va-be') || key.includes('mẹ') || key.includes('bé')) {
    return {
      title: 'VD: Xe đẩy em bé Aprica Nhật Bản siêu nhẹ, gấp gọn mới 95%',
      description: 'Mô tả thương hiệu, độ tuổi phù hợp, chất liệu, tình trạng sử dụng thực tế và vệ sinh/khử khuẩn...'
    };
  }

  if (key.includes('pet') || key.includes('thu-cung') || key.includes('thú cưng') || key.includes('chó') || key.includes('mèo')) {
    return {
      title: 'VD: Chó Poodle thuần chủng 2 tháng tuổi đã tiêm phòng 2 mũi',
      description: 'Mô tả giống loài, độ tuổi, giới tính, tình trạng sức khỏe, sổ tiêm phòng và chế độ ăn...'
    };
  }

  if (key.includes('fashion') || key.includes('thoi-trang') || key.includes('thời trang') || key.includes('quần áo') || key.includes('giày')) {
    return {
      title: 'VD: Áo khoác nam da thật size L màu đen mới 99% chính hãng',
      description: 'Mô tả thương hiệu, chất liệu, size (kích cỡ), kiểu dáng, màu sắc và tình trạng mới/cũ...'
    };
  }

  if (key.includes('sports') || key.includes('the-thao') || key.includes('thể thao') || key.includes('sách') || key.includes('nhạc cụ')) {
    return {
      title: 'VD: Đàn Guitar Acoustic Fender chính hãng kèm bao da và phím gảy',
      description: 'Mô tả thương hiệu, chất liệu, phụ kiện đi kèm, tình trạng âm thanh/ngoại hình và lịch sử sử dụng...'
    };
  }

  if (key.includes('tech') || key.includes('cong-nghe') || key.includes('điện thoại') || key.includes('laptop') || key.includes('máy tính')) {
    return {
      title: 'VD: iPhone 15 Pro Max 256GB Titanium chính chủ mới 99%',
      description: 'Mô tả thực tế tình trạng máy, dung lượng pin, thời gian bảo hành, phụ kiện đi kèm (sạc, hộp) và lý do bán...'
    };
  }

  return {
    title: 'VD: Tên sản phẩm/món đồ, thương hiệu, tình trạng và đặc điểm nổi bật',
    description: 'Mô tả thực tế tình trạng, kích thước, phụ kiện đi kèm, bảo hành và lý do thanh lý...'
  };
}
