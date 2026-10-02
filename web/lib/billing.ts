export const vnd = (value: string | number | null | undefined) => (Number(value ?? 0) || 0).toLocaleString('vi-VN') + '\u00a0đ';
export const dateVi = (value?: string | null) => (value ? new Date(value).toLocaleDateString('vi-VN') : '—');
export const dateTimeVi = (value?: string | null) => (value ? new Date(value).toLocaleString('vi-VN') : '—');
export const daysLeft = (value?: string | null) => (value ? Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000)) : null);
export const newKey = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k${Date.now()}${Math.random().toString(16).slice(2)}`);
export type Plan = { id: string; code: string; name: string; version_id: string; price: string; billing_cycle: 'MONTHLY' | 'YEARLY'; max_listings: number | null; features: unknown };
export type PromoPackage = { id: string; code: string; name: string; version_id: string; price: string; duration_hours: number; promotion_type: 'FEATURED' | 'BOOST' | 'TOP_SEARCH' };
export const featureList = (features: unknown): string[] => (Array.isArray(features) ? features.filter((f): f is string => typeof f === 'string') : []);
export const promoLabel = (type: string) => (type === 'FEATURED' ? 'Tin nổi bật' : type === 'BOOST' ? 'Đẩy tin lên đầu' : 'Hiện đầu tìm kiếm');
export const durationLabel = (hours: number) => (hours % 24 === 0 ? `${hours / 24} ngày` : `${hours} giờ`);

const PLAN_LABELS: Record<string, string> = { free: 'Free (Miễn phí)', 'gói free': 'Free (Miễn phí)', 'gói miễn phí': 'Free (Miễn phí)', 'miễn phí': 'Free (Miễn phí)', pro: 'Pro (Chuyên nghiệp)', 'gói pro': 'Pro (Chuyên nghiệp)', business: 'Business (Kinh doanh)', 'gói business': 'Business (Kinh doanh)', enterprise: 'Enterprise (Cao cấp)', 'gói enterprise': 'Enterprise (Cao cấp)' };
/** Tên hiển thị chuẩn của gói bán hàng: Free (Miễn phí), Pro (Chuyên nghiệp), Business (Kinh doanh), Enterprise (Cao cấp). */
export const planLabel = (name: string | null | undefined) => PLAN_LABELS[String(name ?? '').trim().toLowerCase()] ?? String(name ?? '');
export const FREE_PLAN_LABEL = 'Free (Miễn phí)';
