import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Tin người dùng chọn "Không quan tâm": ẩn khỏi danh sách trên máy này (giống web, lưu cục bộ). */
const KEY = 'tt-hidden-products';
let ids = new Set<string>();
let loaded = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());

async function load() {
  if (loaded) return;
  loaded = true;
  try { const raw = await AsyncStorage.getItem(KEY); if (raw) { ids = new Set(JSON.parse(raw) as string[]); emit(); } } catch { /* bỏ qua */ }
}

export function useHiddenProducts() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force(n => n + 1);
    subs.add(f); void load();
    return () => { subs.delete(f); };
  }, []);
  const isHidden = useCallback((id: string) => ids.has(id), []);
  const hide = useCallback((id: string) => {
    ids = new Set([...ids, id]); emit();
    AsyncStorage.setItem(KEY, JSON.stringify([...ids].slice(-500))).catch(() => undefined);
  }, []);
  return { isHidden, hide };
}
