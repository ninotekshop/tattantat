import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import type { Page, Product } from './types';

/** Danh sách tin có phân trang (cuộn vô hạn) từ /search/products. */
export function useProducts(params: Record<string, string | number | undefined>) {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const page = useRef(1), busy = useRef(false), done = useRef(false);
  const key = JSON.stringify(params);

  const load = useCallback(async (reset: boolean) => {
    if (busy.current || (!reset && done.current)) return;
    busy.current = true; setError('');
    const next = reset ? 1 : page.current + 1;
    const q = new URLSearchParams();
    Object.entries({ limit: 20, ...JSON.parse(key), page: next }).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)); });
    try {
      const r = await api<Page<Product>>(`/search/products?${q.toString()}`);
      page.current = next; setTotal(r.total);
      setItems(prev => (reset ? r.items : [...prev, ...r.items.filter(i => !prev.some(p => p.id === i.id))]));
      done.current = r.items.length === 0 || next * r.limit >= r.total;
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được danh sách tin.'); }
    finally { busy.current = false; setLoading(false); setRefreshing(false); }
  }, [key]);

  useEffect(() => { done.current = false; setLoading(true); void load(true); }, [load]);
  const refresh = useCallback(() => { setRefreshing(true); done.current = false; void load(true); }, [load]);
  const more = useCallback(() => void load(false), [load]);
  return { items, total, loading, refreshing, error, refresh, more };
}
