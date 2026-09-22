export type WebSession = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; fullName: string; avatarUrl?: string | null };
};

const sessionKey = 'tattantat.web.session';

let cachedRawSession: string | null = null;
let cachedSession: WebSession | null = null;

export function saveSession(session: WebSession) {
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
  cachedRawSession = null;
  cachedSession = null;
  window.dispatchEvent(new Event('tattantat-auth-change'));
}

export function readSessionSnapshot(): WebSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(sessionKey);
    if (raw === cachedRawSession) {
      return cachedSession;
    }
    cachedRawSession = raw;
    if (!raw) {
      cachedSession = null;
      return null;
    }
    const value = JSON.parse(raw) as WebSession;
    cachedSession = typeof value?.accessToken === 'string' && !!value.accessToken &&
      typeof value.refreshToken === 'string' && !!value.refreshToken &&
      typeof value.user?.id === 'string' && !!value.user.id && typeof value.user.fullName === 'string' ? value : null;
    return cachedSession;
  } catch {
    cachedRawSession = null;
    cachedSession = null;
    return null;
  }
}

export function readSession(): WebSession | null {
  return readSessionSnapshot();
}

export function clearSession() {
  window.localStorage.removeItem(sessionKey);
  cachedRawSession = null;
  cachedSession = null;
  window.dispatchEvent(new Event('tattantat-auth-change'));
}
