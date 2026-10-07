import Constants from 'expo-constants';
import { clearSession, currentSession, saveSession, type Session } from './session';

export const API_URL: string = ((Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ?? 'https://tattantat.vn/api/v1').replace(/\/$/, '');
export const SITE_URL = API_URL.replace(/\/api\/v1$/, '');

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string | null = null, public fields: Record<string, string> = {}) { super(message); }
}

type Envelope<T> = { success: boolean; data: T; message: string | string[] | null; errorCode: string | null; errors?: Record<string, string> };

let refreshing: Promise<Session | null> | null = null;
async function refresh(old: Session): Promise<Session | null> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: old.refreshToken }) });
      const j = (await res.json().catch(() => null)) as Envelope<Session> | null;
      if (!res.ok || !j?.success || !j.data?.accessToken) { if (res.status === 401 || res.status === 403) await clearSession(); return null; }
      await saveSession(j.data); return j.data;
    } catch { return null; }
  })();
  try { return await refreshing; } finally { refreshing = null; }
}

async function parse<T>(res: Response): Promise<T> {
  const j = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !j?.success) {
    const msg = Array.isArray(j?.message) ? j!.message.join('. ') : j?.message;
    const fallback = res.status === 401 ? 'Vui lòng đăng nhập để tiếp tục.' : res.status === 429 ? 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.' : res.status >= 500 ? 'Máy chủ đang bận, vui lòng thử lại.' : 'Có lỗi xảy ra, vui lòng thử lại.';
    throw new ApiError(msg || fallback, res.status, j?.errorCode ?? null, j?.errors ?? {});
  }
  return j.data;
}

/** Gọi API: tự gắn token, tự làm mới token khi hết hạn. */
export async function api<T>(path: string, opts: { method?: string; body?: unknown; auth?: boolean; idempotencyKey?: string } = {}): Promise<T> {
  const session = currentSession();
  const send = (token?: string) => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
    if (opts.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
    return fetch(API_URL + path, { method: opts.method ?? 'GET', headers, body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body) });
  };
  if (opts.auth && !session) throw new ApiError('Vui lòng đăng nhập để tiếp tục.', 401);
  let res: Response | undefined;
  // Yêu cầu đọc (GET) tự thử lại tối đa 2 lần khi mạng chập chờn / máy chủ bận (429, 5xx).
  const reads = (opts.method ?? 'GET') === 'GET';
  for (let i = 0; i <= (reads ? 2 : 0); i++) {
    try { res = await send(session?.accessToken); } catch { res = undefined; }
    if (res && !(reads && (res.status === 429 || res.status >= 500))) break;
    if (i < (reads ? 2 : 0)) await new Promise(r => setTimeout(r, 700 * (i + 1)));
  }
  if (!res) throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.', 0);
  if (res.status === 401 && session && !path.startsWith('/auth/')) {
    const next = await refresh(session);
    if (!next) throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
    res = await send(next.accessToken);
  }
  return parse<T>(res);
}

/** Tải tệp (ảnh) lên kèm tiến trình. */
export function upload<T>(path: string, file: { uri: string; name: string; type: string }, onProgress?: (p: number) => void, field = 'file'): Promise<T> {
  return new Promise((resolve, reject) => {
    const doSend = (token?: string, retried = false) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', API_URL + path);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 180_000;
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
      xhr.onerror = xhr.ontimeout = () => reject(new ApiError('Tải ảnh lên chưa thành công. Kiểm tra mạng và thử lại.', 0));
      xhr.onload = async () => {
        const s = currentSession();
        if (xhr.status === 401 && s && !retried) { const n = await refresh(s); if (n) return doSend(n.accessToken, true); }
        try { resolve(await parse<T>(new Response(xhr.responseText, { status: xhr.status }))); } catch (e) { reject(e); }
      };
      const fd = new FormData();
      fd.append(field, file as unknown as Blob);
      xhr.send(fd);
    };
    doSend(currentSession()?.accessToken);
  });
}

/** Tải nhiều tệp một lần (trường `files`) kèm các trường văn bản, có tiến độ. */
export function uploadMany<T>(path: string, files: { uri: string; name: string; type: string }[], onProgress?: (p: number) => void, fields: Record<string, string> = {}, field = 'files'): Promise<T> {
  return new Promise((resolve, reject) => {
    const doSend = (token?: string, retried = false) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', API_URL + path);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 300_000;
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
      xhr.onerror = xhr.ontimeout = () => reject(new ApiError('Tải tệp lên chưa thành công. Kiểm tra mạng và thử lại.', 0));
      xhr.onload = async () => {
        const s = currentSession();
        if (xhr.status === 401 && s && !retried) { const n = await refresh(s); if (n) return doSend(n.accessToken, true); }
        try { resolve(await parse<T>(new Response(xhr.responseText, { status: xhr.status }))); } catch (e) { reject(e); }
      };
      const fd = new FormData();
      files.forEach(f => fd.append(field, f as unknown as Blob));
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
      xhr.send(fd);
    };
    doSend(currentSession()?.accessToken);
  });
}

/** Đường dẫn ảnh tương đối → tuyệt đối. */
export const media = (url?: string | null) => !url ? '' : /^(https?:\/\/|data:)/.test(url) ? url : SITE_URL + (url.startsWith('/') ? url : '/' + url);
