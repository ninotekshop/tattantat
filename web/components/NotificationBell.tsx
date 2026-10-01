'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { memberRequest } from '../lib/api';
import { readSession } from '../lib/auth';
import { noticeIcon } from './NoticeIcon';
import { GROUP_STYLE, groupOf, noticeLink, timeAgo, type Notice } from '../lib/notifications';

function subscribe(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', listener); window.addEventListener('tattantat-auth-change', listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener('tattantat-auth-change', listener); };
}
const userId = () => readSession()?.user.id ?? '';

export function NotificationBell() {
  const router = useRouter();
  const uid = useSyncExternalStore(subscribe, userId, () => '');
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[] | null>(null);
  const [error, setError] = useState('');
  const box = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    if (!readSession() || document.hidden) return;
    try { setCount((await memberRequest<{ count: number }>('/notifications/unread-count')).count); } catch { /* im lặng: chuông không được làm hỏng trang */ }
  }, []);
  useEffect(() => {
    if (!uid) { setCount(0); setItems(null); return; }
    void refreshCount();
    const timer = setInterval(() => void refreshCount(), 30000);
    const onVisible = () => { if (!document.hidden) void refreshCount(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [uid, refreshCount]);

  const load = useCallback(async () => {
    setError('');
    try { setItems(await memberRequest<Notice[]>('/notifications?limit=12')); } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được thông báo.'); setItems([]); }
  }, []);
  useEffect(() => { if (open) void load(); }, [open, load]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  function toggle() {
    if (!readSession()) { router.push('/login?next=' + encodeURIComponent('/notifications')); return; }
    setOpen(v => !v);
  }
  async function openItem(n: Notice) {
    setOpen(false);
    if (!n.is_read) {
      setItems(list => list?.map(x => (x.id === n.id ? { ...x, is_read: true } : x)) ?? null);
      setCount(c => Math.max(0, c - 1));
      void memberRequest(`/notifications/${n.id}/read`, 'PATCH', {}).catch(() => undefined);
    }
    router.push(noticeLink(n) ?? '/notifications');
  }
  async function readAll() {
    try { await memberRequest('/notifications/read-all', 'PATCH', {}); setItems(list => list?.map(x => ({ ...x, is_read: true })) ?? null); setCount(0); } catch { /* giữ nguyên */ }
  }

  return <div ref={box} style={{ position: 'relative', display: 'inline-flex' }}>
    <button className="bell-btn" onClick={toggle} title="Thông báo" aria-label={count ? `Thông báo, ${count} chưa đọc` : 'Thông báo'} aria-haspopup="true" aria-expanded={open}>
      <Bell size={20} />
      {count > 0 && <span className="bell-badge">{count > 99 ? '99+' : count}</span>}
    </button>
    {open && <div role="dialog" aria-label="Thông báo" style={{ position: 'absolute', top: 'calc(100% + 10px)', right: -60, width: 380, maxWidth: 'calc(100vw - 24px)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 14px 40px rgba(15,23,42,.2)', zIndex: 300, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <strong style={{ fontSize: 15, color: '#0f172a' }}>Thông báo</strong>
        <button onClick={readAll} disabled={!count} style={{ border: 0, background: 'none', color: count ? '#00a65a' : '#94a3b8', fontWeight: 600, fontSize: 12.5, cursor: count ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCheck size={14} /> Đọc tất cả</button>
      </div>
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {items === null && <p style={{ padding: 20, color: '#64748b', margin: 0 }}>Đang tải…</p>}
        {error && <p role="alert" style={{ padding: 16, color: '#b91c1c', margin: 0, fontSize: 13 }}>{error}</p>}
        {items?.length === 0 && !error && <p style={{ padding: 28, textAlign: 'center', color: '#64748b', margin: 0 }}>Bạn chưa có thông báo nào.</p>}
        {items?.map(n => { const st = GROUP_STYLE[groupOf(n.type)]; const Icon = noticeIcon(n.type); return <button key={n.id} onClick={() => void openItem(n)} className={'nb-item' + (n.is_read ? '' : ' unread')}>
          <span className="nb-ico" aria-hidden style={{ background: st.bg, color: st.fg }}><Icon size={18} />{!n.is_read && <i className="nb-dot" />}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}><span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 8px', borderRadius: 10, background: st.bg, color: st.fg }}>{st.label}</span><span style={{ fontSize: 11.5, color: '#94a3b8' }}>{timeAgo(n.created_at)}</span></span>
            <span style={{ display: 'block', fontWeight: n.is_read ? 600 : 800, fontSize: 13.5, color: '#0f172a' }}>{n.title}</span>
            <span style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{n.content}</span>
          </span></button>; })}
      </div>
      <Link href="/notifications" onClick={() => setOpen(false)} style={{ display: 'block', textAlign: 'center', padding: 12, fontWeight: 700, color: '#00a65a', textDecoration: 'none', fontSize: 13.5, borderTop: '1px solid #f1f5f9' }}>Xem tất cả thông báo</Link>
    </div>}
  </div>;
}
