import { absUrl, EmailSpec, Tone } from './email-template';

type Style = { tone: Tone; icon: string; eyebrow: string; cta: string; tips?: string[] };

const SAFE_TIPS = ['Luôn thanh toán và trao đổi qua Tất Tần Tật để được bảo vệ khi có tranh chấp.', 'Không chuyển khoản trước cho người lạ, không chia sẻ mã OTP với bất kỳ ai.'];

/** Kiểu hiển thị email theo loại thông báo. */
export function styleFor(type: string): Style {
  const t = type.toUpperCase();
  if (t === 'ORDER_PAID') return { tone: 'success', icon: '💳', eyebrow: 'Đơn hàng', cta: 'Xem đơn hàng', tips: SAFE_TIPS };
  if (t === 'ORDER_COMPLETED') return { tone: 'success', icon: '✅', eyebrow: 'Đơn hàng', cta: 'Đánh giá giao dịch' };
  if (/^ORDER_REFUND/.test(t) || /^REFUND/.test(t)) return { tone: 'info', icon: '💸', eyebrow: 'Hoàn tiền', cta: 'Xem chi tiết' };
  if (/DISPUTE/.test(t)) return { tone: 'warning', icon: '⚖️', eyebrow: 'Khiếu nại', cta: 'Xem khiếu nại' };
  if (/^ORDER_/.test(t)) return { tone: 'info', icon: '📦', eyebrow: 'Đơn hàng', cta: 'Xem đơn hàng' };
  if (/^PAYOUT_/.test(t)) return { tone: 'success', icon: '💰', eyebrow: 'Thanh toán', cta: 'Xem ví tiền' };
  if (t === 'TOPUP_CONFIRMED') return { tone: 'success', icon: '💰', eyebrow: 'Ví Tất Tần Tật', cta: 'Xem ví tiền' };
  if (t === 'TOPUP_REJECTED') return { tone: 'danger', icon: '⚠️', eyebrow: 'Ví Tất Tần Tật', cta: 'Xem ví tiền' };
  if (t === 'ACCOUNT_VERIFIED' || t === 'ACCOUNT_PHONE_VERIFIED') return { tone: 'success', icon: '🛡️', eyebrow: 'Xác minh tài khoản', cta: 'Xem tài khoản', tips: ['Huy hiệu “Đã xác thực” giúp người mua tin tưởng và liên hệ bạn nhiều hơn.', 'Hoàn tất cả xác minh số điện thoại và CCCD để được nâng hạn mức đăng tin.'] };
  if (/^IDENTITY_/.test(t)) return { tone: 'danger', icon: '🪪', eyebrow: 'Xác minh tài khoản', cta: 'Gửi lại hồ sơ', tips: ['Chụp rõ nét, đủ 4 góc giấy tờ, không bị lóa sáng.', 'Ảnh chân dung cần thấy rõ khuôn mặt và giấy tờ đang cầm.'] };
  if (t === 'LISTING_APPROVED') return { tone: 'success', icon: '🎉', eyebrow: 'Tin đăng', cta: 'Xem tin đăng', tips: ['Ảnh thật, rõ nét và mô tả chi tiết giúp tin được xem nhiều hơn.', 'Trả lời tin nhắn nhanh để không bỏ lỡ người mua.', 'Dùng gói đẩy tin để tin luôn nằm ở vị trí nổi bật.'] };
  if (t === 'LISTING_PENDING') return { tone: 'info', icon: '⏳', eyebrow: 'Tin đăng', cta: 'Xem tin đã đăng' };
  if (/^LISTING_/.test(t)) return { tone: 'danger', icon: '📝', eyebrow: 'Tin đăng', cta: 'Chỉnh sửa tin', tips: ['Xem lại Quy định đăng tin để biết nội dung bị hạn chế.', 'Chỉnh sửa theo lý do được nêu rồi gửi lại để được duyệt.'] };
  if (/^SUBSCRIPTION_EXPIRING|^PROMOTION_EXPIRING/.test(t)) return { tone: 'warning', icon: '⏰', eyebrow: 'Gói dịch vụ', cta: 'Gia hạn ngay' };
  if (/^SUBSCRIPTION_(EXPIRED|CANCELLED)/.test(t)) return { tone: 'danger', icon: '📭', eyebrow: 'Gói dịch vụ', cta: 'Xem các gói' };
  if (/^(SUBSCRIPTION_|PROMOTION_)/.test(t)) return { tone: 'success', icon: '🚀', eyebrow: 'Gói dịch vụ', cta: 'Quản lý gói', tips: ['Theo dõi lượt xem và liên hệ trong mục Thống kê bán hàng.'] };
  if (/^AD_|ADVERTISING/.test(t)) return { tone: 'warning', icon: '📣', eyebrow: 'Quảng cáo', cta: 'Xem chi tiết' };
  if (/^REVIEW_/.test(t)) return { tone: 'info', icon: '⭐', eyebrow: 'Đánh giá', cta: 'Xem đánh giá' };
  if (/^CHAT_|^MESSAGE/.test(t)) return { tone: 'info', icon: '💬', eyebrow: 'Tin nhắn', cta: 'Trả lời ngay' };
  if (t === 'SAVED_SEARCH') return { tone: 'info', icon: '🔔', eyebrow: 'Tìm kiếm đã lưu', cta: 'Xem tin mới' };
  return { tone: 'brand', icon: '🔔', eyebrow: 'Thông báo', cta: 'Xem chi tiết' };
}

/** Đường dẫn mặc định khi thông báo không gắn với tin/đơn cụ thể. */
export function defaultLink(type: string): string {
  const t = type.toUpperCase();
  if (/^(SUBSCRIPTION_|PROMOTION_|AD_)/.test(t)) return '/goi-dich-vu';
  if (/^(TOPUP_|PAYOUT_)/.test(t)) return '/vi-tien';
  if (/^(ACCOUNT_|IDENTITY_)/.test(t)) return '/xac-minh';
  if (/^LISTING_/.test(t)) return '/account?section=listings';
  if (/^ORDER_|DISPUTE|REFUND/.test(t)) return '/orders';
  return '/notifications';
}

export function notificationEmail(type: string, title: string, content: string, link: string | null, name?: string | null): EmailSpec {
  const s = styleFor(type);
  return {
    tone: s.tone, icon: s.icon, eyebrow: s.eyebrow, title,
    preheader: content.slice(0, 140),
    greeting: name ? `Xin chào ${name},` : 'Xin chào bạn,',
    paragraphs: [content],
    cta: { label: s.cta, url: absUrl(link || defaultLink(type)) },
    tips: s.tips ? { items: s.tips } : undefined,
    managePrefs: true,
    footerNote: 'Bạn nhận được email này vì có hoạt động mới trên tài khoản Tất Tần Tật của bạn.',
  };
}
