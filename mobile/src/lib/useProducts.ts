import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api } from './api';
import type { Page, Product } from './types';

/** Danh sách tin có phân trang (cuộn vô hạn) từ /search/products. Tự thử lại khi lần tải đầu lỗi/trống (mạng hoặc máy chủ vừa khởi động). */
export function useProducts(params: Record<string, string | number | undefined>) {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const page = useRef(1), busy = useRef(false), done = useRef(false), req = useRef(0), retries = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = JSON.stringify(params);

  const load = useCallback(async (reset: boolean) => {
    if (!reset && (busy.current || done.current)) return;
    const id = reset ? ++req.current : req.current; // tải lại (reset) luôn thắng lần tải đang dở, kết quả cũ bị bỏ
    busy.current = true; setError('');
    const next = reset ? 1 : page.current + 1;
    const q = new URLSearchParams();
    Object.entries({ limit: 20, ...JSON.parse(key), page: next }).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)); });
    let retry = false;
    try {
      const r = await api<Page<Product>>(`/search/products?${q.toString()}`);
      if (id !== req.current) return;
      page.current = next; setTotal(r.total);
      setItems(prev => (reset ? r.items : [...prev, ...r.items.filter(i => !prev.some(p => p.id === i.id))]));
      done.current = r.items.length === 0 || next * r.limit >= r.total;
      if (reset && r.items.length === 0 && !JSON.parse(key).q && retries.current < 2) retry = true; // trống ở lần đầu: thử lại thay vì báo "chưa có tin"
      else retries.current = 0;
    } catch (e) {
      if (id !== req.current) return;
      if (reset && retries.current < 2) retry = true;
      else setError(e instanceof Error ? e.message : 'Không tải được danh sách tin.');
    }
    if (id !== req.current) return;
    busy.current = false;
    if (retry) {
      retries.current += 1;
      timer.current = setTimeout(() => void load(true), 1500 * retries.current);
      return; // giữ trạng thái đang tải
    }
    setLoading(false); setRefreshing(false);
  }, [key]);

  useEffect(() => { done.current = false; retries.current = 0; setLoading(true); void load(true); return () => { if (timer.current) clearTimeout(timer.current); }; }, [load]);
  // Quay lại app từ nền mà danh sách vẫn trống/lỗi → tải lại.
  const stale = useRef(false); stale.current = items.length === 0 || !!error;
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s === 'active' && stale.current) { retries.current = 0; done.current = false; void load(true); } });
    return () => sub.remove();
  }, [load]);
  const refresh = useCallback(() => { setRefreshing(true); done.current = false; retries.current = 0; void load(true); }, [load]);
  const more = useCallback(() => void load(false), [load]);
  return { items, total, loading, refreshing, error, refresh, more };
}
