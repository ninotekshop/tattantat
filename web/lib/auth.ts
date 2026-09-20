export type WebSession = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; fullName: string; avatarUrl?: string | null };
};

const sessionKey = 'tattantat.web.session';

export function saveSession(session: WebSession) {
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
  window.dispatchEvent(new Event('tattantat-auth-change'));
}

export function readSession(): WebSession | null {
  try {
    const raw = window.localStorage.getItem(sessionKey);
    if (!raw) return null;
    const value = JSON.parse(raw) as WebSession;
    return typeof value?.accessToken === 'string' && !!value.accessToken &&
      typeof value.refreshToken === 'string' && !!value.refreshToken &&
      typeof value.user?.id === 'string' && !!value.user.id && typeof value.user.fullName === 'string' ? value : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  window.localStorage.removeItem(sessionKey);
  window.dispatchEvent(new Event('tattantat-auth-change'));
}
