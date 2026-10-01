import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import { clearSession, loadSession, onSessionChange, saveSession, type Session } from './session';
import { registerPush, unregisterPush } from './push';

type AuthState = {
  ready: boolean;
  session: Session | null;
  signIn: (s: Session) => Promise<void>;
  signOut: () => Promise<void>;
};
const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let alive = true;
    loadSession().then(s => { if (alive) { setSession(s); setReady(true); if (s) void registerPush(); } });
    const off = onSessionChange(s => setSession(s));
    return () => { alive = false; off(); };
  }, []);

  const signIn = useCallback(async (s: Session) => { await saveSession(s); void registerPush(); }, []);
  const signOut = useCallback(async () => {
    const s = (await loadSession());
    await unregisterPush().catch(() => undefined);
    if (s) void api('/auth/logout', { method: 'POST', body: { refreshToken: s.refreshToken } }).catch(() => undefined);
    await clearSession();
  }, []);

  const value = useMemo(() => ({ ready, session, signIn, signOut }), [ready, session, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth phải nằm trong AuthProvider');
  return v;
}
