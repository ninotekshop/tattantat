// Display groups are presentation only; category IDs always come from the API.
export const categoryGroups = [
  { key: 'technology', label: 'Điện thoại - Máy tính', short: 'Điện thoại\nMáy tính', slugs: ['dien-thoai', 'laptop', 'iphone', 'samsung', 'xiaomi', 'oppo', 'macbook', 'dell', 'hp', 'lenovo', 'asus'], icon: 'phone', tone: 'violet' },
  { key: 'electronics', label: 'Điện tử - Điện gia dụng', short: 'Điện tử\nGia dụng', slugs: ['do-dien-tu'], icon: 'monitor', tone: 'blue' },
  { key: 'fashion', label: 'Thời trang - Làm đẹp', short: 'Thời trang\nLàm đẹp', slugs: ['thoi-trang'], icon: 'shirt', tone: 'amber' },
  { key: 'vehicles', label: 'Xe cộ', short: 'Xe cộ', slugs: ['xe-co', 'xe-may', 'o-to', 'xe-dap'], icon: 'car', tone: 'purple' },
  { key: 'property', label: 'Nhà đất - Bất động sản', short: 'Nhà đất\nBĐS', slugs: ['bat-dong-san'], icon: 'house', tone: 'coral' },
  { key: 'services', label: 'Dịch vụ', short: 'Dịch vụ', slugs: ['dich-vu'], icon: 'tools', tone: 'cyan' },
  { key: 'home', label: 'Đồ dùng gia đình', short: 'Đồ gia đình', slugs: ['do-gia-dung'], icon: 'sofa', tone: 'amber' },
  { key: 'leisure', label: 'Thể thao - Giải trí', short: 'Thể thao\nGiải trí', slugs: ['the-thao', 'do-choi'], icon: 'game', tone: 'purple' },
  { key: 'books', label: 'Sách - Đồ dùng học tập', short: 'Sách\nHọc tập', slugs: ['sach-van-phong-pham'], icon: 'book', tone: 'blue' },
  { key: 'other', label: 'Khác', short: 'Khác', slugs: ['khac', 'me-va-be'], icon: 'more', tone: 'violet' },
] as const;

export const categoryHref = (key: string) => '/?category=' + encodeURIComponent(key) + '#products';

// PostgreSQL returns money as strings. Do not lose precision by coercing BIGINT to Number.
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
