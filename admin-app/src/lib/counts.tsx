import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { api } from './api';
import { useAuth } from './auth';

export type Counts = { 'tin-dang': number; 'xac-minh': number; reports: number; 'don-hang': number; 'thanh-toan-online': number; 'nguoi-dung': number };
const EMPTY: Counts = { 'tin-dang': 0, 'xac-minh': 0, reports: 0, 'don-hang': 0, 'thanh-toan-online': 0, 'nguoi-dung': 0 };
const Ctx = createContext<{ counts: Counts; reload: () => void }>({ counts: EMPTY, reload: () => undefined });

/** Số việc cần xử lý, làm mới mỗi 30 giây và khi mở lại app. */
export function CountsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [counts, setCounts] = useState<Counts>(EMPTY);
  const reload = useCallback(() => { if (!session) return; api<Counts>('/admin/alerts/counts', { auth: true }).then(c => setCounts({ ...EMPTY, ...c })).catch(() => undefined); }, [session]);
  useEffect(() => {
    reload();
    const t = setInterval(reload, 30000);
    const sub = AppState.addEventListener('change', s => { if (s === 'active') reload(); });
    return () => { clearInterval(t); sub.remove(); };
  }, [reload]);
  const value = useMemo(() => ({ counts, reload }), [counts, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useCounts = () => useContext(Ctx);
