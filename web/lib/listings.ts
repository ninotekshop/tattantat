import { readSession } from './auth';
import { sessionFetch } from './api';
// Pure, framework-free contract shared with the API: validation cannot drift.
export { visible, validateListing, publicData, fieldTypes } from '../../backend/src/listings/listing-domain';
export type { Field, Template, ListingData } from '../../backend/src/listings/listing-domain';
import type { Template, ListingData } from '../../backend/src/listings/listing-domain';

export type ListingCategory = { id: string; parentId: string | null; name: string; slug: string; isGroup: boolean };
export type ListingMedia = { id: string; kind: 'images' | 'videos'; url: string };
export type Listing = { id: string; categoryId: string; revision: number; status: string; productId: string | null; template: Template; data: ListingData; media: ListingMedia[]; owner: boolean };
export type ListingSummary = Pick<Listing, 'id' | 'categoryId' | 'status' | 'revision' | 'productId'> & { title: string | null; updatedAt: string };
const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');
export class ListingError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, string> = {}) { super(message); }
}
function parsePayload(status: number, payload: { success?: boolean; message?: string | string[]; errors?: Record<string,string>; data?: unknown } | null) {
  if (status < 200 || status >= 300 || !payload?.success) {
    const message = Array.isArray(payload?.message) ? payload.message.join('. ') : payload?.message;
    throw new ListingError(status === 401 ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.' : message || 'Không thể kết nối máy chủ. Bản nháp chưa được lưu.', status, payload?.errors);
  }
  return payload.data;
}
export async function listingRequest<T>(path: string, method = 'GET', body?: unknown, key?: string): Promise<T> {
  const session = readSession();
  const response = await sessionFetch(path, { method, cache: 'no-store', headers: {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(key ? { 'Idempotency-Key': key } : {}),
  }, body: body ? JSON.stringify(body) : undefined }, session?.accessToken);
  return parsePayload(response.status, await response.json().catch(() => null)) as T;
}
export function uploadListingMedia(id: string, kind: 'images' | 'videos', file: File, progress: (value: number) => void): Promise<ListingMedia> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${base}/listings/${id}/${kind}`);
    const session = readSession();
    if (session) xhr.setRequestHeader('Authorization', `Bearer ${session.accessToken}`);
    xhr.timeout = 120000;
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress(Math.round(event.loaded / event.total * 100)); };
    xhr.onerror = xhr.ontimeout = () => reject(new ListingError('Tải tệp chưa thành công. Hãy thử lại.', 0));
    xhr.onload = () => { try { resolve(parsePayload(xhr.status, JSON.parse(xhr.responseText)) as ListingMedia); } catch (error) { reject(error); } };
    const data = new FormData(); data.append('file', file); xhr.send(data);
  });
}
export const conditionLabels: Record<string,string> = { NEW:'Mới', LIKE_NEW:'Như mới', USED_GOOD:'Đã dùng, còn tốt', USED_FAIR:'Đã dùng, có hao mòn', FOR_PARTS:'Cần sửa / lấy linh kiện' };
export const priceLabels: Record<string,string> = { FIXED:'Giá cố định', CONTACT:'Liên hệ', FREE:'Cho tặng miễn phí', HOUR:'Theo giờ', DAY:'Theo ngày', MONTH:'Theo tháng', M2:'Theo m²' };
export function listingPrice(data: ListingData) {
  if (data.priceMode === 'CONTACT' || data.priceMode === 'FREE') return priceLabels[data.priceMode];
  if (!data.price || !/^\d+$/.test(data.price)) return 'Chưa có giá';
  return BigInt(data.price).toLocaleString('vi-VN') + ' đ' + ({ HOUR:'/giờ', DAY:'/ngày', MONTH:'/tháng', M2:'/m²' }[data.priceMode ?? ''] ?? '');
}
