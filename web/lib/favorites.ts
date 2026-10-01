'use client';
import { useCallback, useEffect, useState } from 'react';
import { memberRequest, type Product } from './api';
import { readSession } from './auth';

// Kho dùng chung danh sách tin yêu thích: mọi thẻ sản phẩm trên trang cùng một nguồn dữ liệu
// nên bấm tim ở đâu, các nơi khác đều cập nhật theo.
let ids = new Set<string>();
let loadedFor: string | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());

async function load(userId: string) {
  if (loadedFor === userId) return;
  if (!loading) {
    loading = memberRequest<Product[]>('/favorites')
      .then(items => { ids = new Set(items.map(p => p.id)); loadedFor = userId; })
      .catch(() => {})
      .finally(() => { loading = null; emit(); });
  }
  await loading;
}

function reset() { ids = new Set(); loadedFor = null; emit(); }

export function useFavorites() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force(n => n + 1);
    listeners.add(fn);
    const sync = () => {
      const session = readSession();
      if (!session) { if (loadedFor) reset(); return; }
      if (loadedFor !== session.user.id) { if (loadedFor) ids = new Set(); void load(session.user.id); }
    };
    sync();
    window.addEventListener('tattantat-auth-change', sync);
    return () => { listeners.delete(fn); window.removeEventListener('tattantat-auth-change', sync); };
  }, []);

  const isFavorite = useCallback((productId: string) => ids.has(productId), []);

  /** Trả về 'login' nếu chưa đăng nhập, 'added' | 'removed' nếu thành công. Ném lỗi nếu máy chủ từ chối. */
  const toggle = useCallback(async (productId: string): Promise<'login' | 'added' | 'removed'> => {
    const session = readSession();
    if (!session) return 'login';
    const had = ids.has(productId);
    // Cập nhật ngay để người dùng thấy phản hồi tức thì, hoàn tác nếu máy chủ báo lỗi.
    if (had) ids.delete(productId); else ids.add(productId);
    ids = new Set(ids); emit();
    try {
      await memberRequest(`/favorites/${encodeURIComponent(productId)}`, had ? 'DELETE' : 'POST');
      return had ? 'removed' : 'added';
    } catch (e) {
      if (had) ids.add(productId); else ids.delete(productId);
      ids = new Set(ids); emit();
      throw e;
    }
  }, []);

  return { isFavorite, toggle };
}
