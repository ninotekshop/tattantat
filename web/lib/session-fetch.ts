type Session = { accessToken: string; refreshToken: string; user: { id: string; fullName: string; avatarUrl?: string | null } };
type Dependencies = { read: () => Session | null; save: (session: Session) => void; clear: () => void; fetch: typeof fetch; base: string };

/** Retry only a rejected authentication check, never a timeout or a failed mutation. */
export function createSessionFetch(deps: Dependencies) {
  let refreshing: { token: string; promise: Promise<Session> } | null = null;
  async function renew(original: Session): Promise<Session> {
    const current = deps.read();
    if (!current || current.user.id !== original.user.id) throw new Error('Tài khoản đã thay đổi. Hãy tải lại trang.');
    if (current.accessToken !== original.accessToken) return current;
    if (refreshing?.token === original.refreshToken) return refreshing.promise;
    const promise = (async () => {
      const response = await deps.fetch(deps.base + '/auth/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: original.refreshToken }), signal: AbortSignal.timeout(20000),
      });
      const payload = await response.json().catch(() => null);
      if (deps.read()?.refreshToken !== original.refreshToken) throw new Error('Phiên đăng nhập đã thay đổi. Hãy tải lại trang.');
      if (!response.ok || !payload?.success) {
        if (response.status === 401 || response.status === 403) deps.clear();
        throw new Error(response.status >= 500 ? 'Máy chủ tạm thời không khả dụng. Hãy thử lại.' : 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.');
      }
      const session = payload.data as Session;
      if (!session?.accessToken || !session.refreshToken || session.user?.id !== original.user.id) throw new Error('Phản hồi đăng nhập không hợp lệ.');
      deps.save(session);
      return session;
    })();
    refreshing = { token: original.refreshToken, promise };
    try { return await promise; } finally { if (refreshing?.promise === promise) refreshing = null; }
  }
  return async (path: string, init: RequestInit = {}, token?: string): Promise<Response> => {
    const original = token ? deps.read() : null;
    if (token && (!original || original.accessToken !== token)) throw new Error('Phiên đăng nhập đã thay đổi. Hãy thử lại.');
    const send = (access?: string) => {
      const headers = new Headers(init.headers);
      if (access) headers.set('Authorization', `Bearer ${access}`);
      return deps.fetch(deps.base + path, { ...init, headers, cache: 'no-store', signal: init.signal ?? AbortSignal.timeout(25000) });
    };
    const response = await send(token);
    if (response.status !== 401 || !original || path.startsWith('/auth/')) return response;
    const updated = await renew(original);
    if (deps.read()?.accessToken !== updated.accessToken) throw new Error('Phiên đăng nhập đã thay đổi. Hãy tải lại trang.');
    return send(updated.accessToken);
  };
}

export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) return '/account';
  try { const url = new URL(value, 'https://local.invalid'); return url.origin === 'https://local.invalid' ? url.pathname + url.search + url.hash : '/account'; }
  catch { return '/account'; }
}
