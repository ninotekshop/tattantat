import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { api } from './api';
import { useAuth } from './auth';
import type { Product } from './types';

/** Kho nhỏ dùng chung: tập id tin đã lưu (tim), để mọi thẻ tin đăng trên app đồng bộ với nhau. */
let ids = new Set<string>();
let loadedFor: string | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());

async function load(userKey: string) {
  if (loadedFor === userKey) return;
  loadedFor = userKey;
  try { ids = new Set((await api<Product[]>('/favorites', { auth: true })).map(p => p.id)); emit(); }
  catch { loadedFor = null; }
}

export function useFavorites() {
  const { session } = useAuth();
  const [, force] = useState(0);
  const userKey = session ? String((session as { user?: { id?: string } }).user?.id ?? 'me') : null;

  useEffect(() => {
    const f = () => force(n => n + 1);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  useEffect(() => {
    if (userKey) void load(userKey);
    else if (loadedFor) { loadedFor = null; ids = new Set(); emit(); }
  }, [userKey]);

  const isFav = useCallback((id: string) => ids.has(id), []);
  const toggle = useCallback(async (id: string) => {
    if (!session) { router.push('/login'); return; }
    const next = !ids.has(id);
    ids = new Set(ids); if (next) ids.add(id); else ids.delete(id); emit();
    try { await api(`/favorites/${id}`, { method: next ? 'POST' : 'DELETE', auth: true }); }
    catch { ids = new Set(ids); if (next) ids.delete(id); else ids.add(id); emit(); }
  }, [session]);

  return { isFav, toggle };
}
