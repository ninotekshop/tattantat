import type { ListingData, Template } from './listing-domain';
import type { ListingMedia } from './types';

export type Listing = { id: string; categoryId: string; revision: number; status: string; productId: string | null; template: Template; data: ListingData; media: ListingMedia[]; owner: boolean };
export const CONDITIONS: [string, string][] = [['NEW', 'Mới'], ['LIKE_NEW', 'Như mới'], ['USED_GOOD', 'Đã dùng, còn tốt'], ['USED_FAIR', 'Đã dùng, có hao mòn'], ['FOR_PARTS', 'Cần sửa / lấy linh kiện']];
export const PRICE_MODES: Record<string, string> = { FIXED: 'Giá cố định', CONTACT: 'Liên hệ', FREE: 'Cho tặng', HOUR: 'Theo giờ', DAY: 'Theo ngày', MONTH: 'Theo tháng', M2: 'Theo m²' };
export const STATUS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Bản nháp', color: '#64748B' }, PENDING_REVIEW: { label: 'Chờ duyệt', color: '#EA580C' }, ACTIVE: { label: 'Đang hiển thị', color: '#00A65A' },
  HIDDEN: { label: 'Đã ẩn', color: '#64748B' }, REJECTED: { label: 'Bị từ chối', color: '#E11D48' }, SOLD: { label: 'Đã bán', color: '#2563EB' }, RESERVED: { label: 'Đang giao dịch', color: '#7C3AED' }, EXPIRED: { label: 'Hết hạn', color: '#64748B' },
};
