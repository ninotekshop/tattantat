import { readSession, saveSession, clearSession } from './auth';
import { createSessionFetch } from './session-fetch';
export type ApiEnvelope<T> = { success: boolean; data: T; message: string | string[] | null; errorCode: string | null };

export type Product = {
  id: string;
  title: string;
  price: string;
  location: string;
  postedAt: string;
  sellerId: string;
  sellerName: string;
  sellerVerified?: boolean;
  sellerAvatar?: string | null;
  imageUrl: string;
  images?: string[];
  videos?: string[];
  hasVideo?: boolean;
  description?: string | null;
  condition?: string | null;
  categoryId?: number | null;
  status?: string;
  listingId?: string | null;
  priceMode?: string;
};

export type Category = { id: number; name: string; slug: string; icon_url?: string | null };

export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window === 'undefined') {
    if (process.env.API_INTERNAL_BASE_URL) return process.env.API_INTERNAL_BASE_URL;
    const port = process.env.PORT || 3000;
    return `http://127.0.0.1:${port}/api/v1`;
  }
  return '/api/v1';
};

const baseUrl = getBaseUrl().replace(/\/$/, '');
export const sessionFetch = createSessionFetch({ read: readSession, save: saveSession, clear: clearSession, fetch: (...args) => fetch(...args), base: baseUrl });
export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string | null = null) { super(message); }
}

export async function apiRequest<T>(path: string, method = 'GET', body?: unknown, token?: string, key?: string): Promise<T> {
  // Yêu cầu đọc (GET) tự thử lại tối đa 2 lần khi mạng chập chờn / máy chủ bận (429, 5xx).
  for (let attempt = 0; ; attempt++) {
    try { return await apiRequestOnce<T>(path, method, body, token, key); }
    catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      if (method !== 'GET' || attempt >= 2 || !(status === 429 || status >= 500 || status === 0)) throw e;
      await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
    }
  }
}

async function apiRequestOnce<T>(path: string, method = 'GET', body?: unknown, token?: string, key?: string): Promise<T> {
  let response;
  try {
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    response = await sessionFetch(path, { method, headers: {
      ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(key ? { 'Idempotency-Key': key } : {}),
    }, body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body) }, token);
  } catch (err) {
    console.error(`[API Fetch Error] to ${baseUrl}${path}:`, err);
    throw new ApiError('Không thể kết nối máy chủ. Hãy thử lại.', 500);
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    const message = Array.isArray(payload?.message) ? payload.message.join('. ') : payload?.message;
    throw new ApiError(message || (response.status === 401 ? 'Vui lòng đăng nhập lại.' : 'Không thể kết nối máy chủ. Hãy thử lại.'), response.status, payload?.errorCode ?? null);
  }
  return payload.data;
}

export function memberRequest<T>(path: string, method = 'GET', body?: unknown, key?: string): Promise<T> {
  const session = readSession();
  if (!session) return Promise.reject(new Error('Vui lòng đăng nhập để tiếp tục.'));
  return apiRequest<T>(path, method, body, session.accessToken, key);
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  return apiRequest<T>(path, 'GET', undefined, token);
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  return apiRequest<T>(path, 'POST', body, token);
}

export const api = {
  categories: () => apiGet<Category[]>('/categories'),
  myProducts: (token: string) => apiGet<Product[]>('/products/mine', token),
  product: (id: string) => apiGet<Product>(`/products/${encodeURIComponent(id)}`, readSession()?.accessToken),
  search: (params: Record<string, string | number | boolean | undefined>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && v !== false) qs.set(k, String(v));
    return apiGet<{ items: Product[]; total: number; page: number; limit: number }>(`/search/products?${qs}`, readSession()?.accessToken);
  },
  hotKeywords: () => apiGet<string[]>('/search/hot-keywords'),
  products: (query = '', categoryId?: number) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (categoryId) params.set('categoryId', String(categoryId));
    return apiGet<Product[]>(`/products${params.size ? `?${params}` : ''}`, readSession()?.accessToken);
  },
};

/** Tải tệp lên kèm tiến trình (fetch không có sự kiện tiến trình tải lên). Nếu token hết hạn (401) thì quay về memberRequest để tự làm mới phiên. */
export function uploadRequest<T>(path: string, form: FormData, onProgress: (percent: number) => void): Promise<T> {
  const session = readSession();
  if (!session) return Promise.reject(new Error('Vui lòng đăng nhập để tiếp tục.'));
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', baseUrl + path);
    xhr.setRequestHeader('Authorization', `Bearer ${session.accessToken}`);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100))); };
    xhr.onerror = () => reject(new ApiError('Không thể kết nối máy chủ. Hãy thử lại.', 500));
    xhr.ontimeout = () => reject(new ApiError('Tải lên quá lâu. Hãy kiểm tra mạng và thử lại.', 408));
    xhr.onload = () => {
      let payload: ApiEnvelope<T> | null = null;
      try { payload = JSON.parse(xhr.responseText); } catch { /* không phải JSON */ }
      if (xhr.status === 401) { memberRequest<T>(path, 'POST', form).then(resolve, reject); return; }
      if (xhr.status >= 200 && xhr.status < 300 && payload?.success) { onProgress(100); resolve(payload.data); return; }
      const message = Array.isArray(payload?.message) ? payload.message.join('. ') : payload?.message;
      reject(new ApiError(message || (xhr.status === 413 ? 'Tệp quá lớn.' : 'Không gửi được tệp. Hãy thử lại.'), xhr.status, payload?.errorCode ?? null));
    };
    xhr.timeout = 5 * 60_000;
    xhr.send(form);
  });
}
