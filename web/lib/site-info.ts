// Thông tin doanh nghiệp và địa chỉ công khai của Tất Tần Tật - dùng chung cho JSON-LD, llms.txt, Markdown, MCP và trang Liên hệ.
export const SITE_NAME = 'Tất Tần Tật';
export const SITE_SLOGAN = 'Mua bán mọi thứ, gần bạn.';
export const SITE_DESCRIPTION = 'Chợ mua bán đồ cũ và mới gần bạn: nhà đất, xe cộ, đồ điện tử, thời trang, thú cưng, dịch vụ. Đăng tin miễn phí, chat trực tiếp với người bán, giao dịch an toàn.';
export const APP_NAME = 'Tất Tần Tật - Mua nhanh bán gọn';

export const COMPANY = {
  legalName: 'Công ty TNHH Công nghệ & Dịch vụ NINOTEK',
  email: 'hotro@tattantat.vn',
  phone: '+842563577988',
  phoneDisplay: '(0256) 35779 888',
  street: '80 Lê Công Miễn',
  locality: 'Phường Quy Nhơn Nam',
  region: 'Gia Lai',
  country: 'VN',
  addressLine: '80 Lê Công Miễn, Phường Quy Nhơn Nam, Tỉnh Gia Lai, Việt Nam',
};

export const APP_LINKS = {
  android: 'https://play.google.com/store/apps/details?id=com.tattantat.app',
  ios: 'https://apps.apple.com/vn/app/t%E1%BA%A5t-t%E1%BA%A7n-t%E1%BA%ADt-mua-nhanh-b%C3%A1n-g%E1%BB%8Dn/id6819581261',
};

// Hồ sơ chính thức của Tất Tần Tật ở bên ngoài (schema.org sameAs), giúp AI agent xác nhận cùng một thực thể.
// Khi có fanpage Facebook, Zalo OA, TikTok, YouTube... của Tất Tần Tật thì thêm link vào đây.
export const SAME_AS: string[] = [APP_LINKS.android, APP_LINKS.ios];

export const INFO_PAGES: { path: string; title: string; desc: string }[] = [
  { path: '/about', title: 'Giới thiệu', desc: 'Tất Tần Tật là gì, tầm nhìn và sứ mệnh' },
  { path: '/contact', title: 'Liên hệ', desc: 'Email, hotline và địa chỉ công ty' },
  { path: '/posting-rules', title: 'Quy định đăng tin', desc: 'Nội dung được phép và bị cấm khi đăng tin' },
  { path: '/safety-guide', title: 'An toàn giao dịch', desc: 'Hướng dẫn mua bán an toàn' },
  { path: '/terms', title: 'Điều khoản sử dụng', desc: 'Điều khoản sử dụng dịch vụ' },
  { path: '/privacy', title: 'Chính sách bảo mật', desc: 'Cách dữ liệu cá nhân được thu thập và bảo vệ' },
  { path: '/regulations', title: 'Quy chế hoạt động', desc: 'Quy chế hoạt động của sàn' },
  { path: '/dispute-resolution', title: 'Giải quyết khiếu nại', desc: 'Quy trình xử lý khiếu nại và tranh chấp' },
];
