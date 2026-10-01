import * as SecureStore from 'expo-secure-store';

export type User = { id: string; fullName: string; avatarUrl?: string | null; role?: string };
export type Session = { accessToken: string; refreshToken: string; user: User };

const KEY = 'tattantat.session.v1';
let cache: Session | null | undefined;
const listeners = new Set<(s: Session | null) => void>();

/** Phiên đăng nhập lưu trong Keychain (iOS) / Keystore (Android). */
export async function loadSession(): Promise<Session | null> {
  if (cache !== undefined) return cache;
  try { const raw = await SecureStore.getItemAsync(KEY); cache = raw ? (JSON.parse(raw) as Session) : null; }
  catch { cache = null; }
  return cache;
}
export const currentSession = () => cache ?? null;
export async function saveSession(s: Session) {
  cache = s; listeners.forEach(l => l(s));
  await SecureStore.setItemAsync(KEY, JSON.stringify(s)).catch(() => undefined);
}
export async function clearSession() {
  cache = null; listeners.forEach(l => l(null));
  await SecureStore.deleteItemAsync(KEY).catch(() => undefined);
}
export function onSessionChange(l: (s: Session | null) => void) { listeners.add(l); return () => { listeners.delete(l); }; }
