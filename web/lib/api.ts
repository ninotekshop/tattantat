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
  imageUrl: string;
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
  let response;
  try {
    response = await sessionFetch(path, { method, headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(key ? { 'Idempotency-Key': key } : {}),
    }, body: body !== undefined ? JSON.stringify(body) : undefined }, token);
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
  products: (query = '', categoryId?: number) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (categoryId) params.set('categoryId', String(categoryId));
    return apiGet<Product[]>(`/products${params.size ? `?${params}` : ''}`, readSession()?.accessToken);
  },
};
