'use client';
import { useSyncExternalStore, type ReactNode } from 'react';
import { readSession, type WebSession } from '../lib/auth';

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener('tattantat-auth-change', listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener('tattantat-auth-change', listener); };
}
export function MemberArea({ children }: { children: (session: WebSession) => ReactNode }) {
  const id = useSyncExternalStore(subscribe, () => readSession()?.user.id ?? '', () => 'loading');
  const session = id && id !== 'loading' ? readSession() : null;
  return <main id="main-content" className="member-page">
    <nav aria-label="Khu vực cá nhân" className="member-nav"><a href="/account">Tài khoản</a><a href="/messages">Tin nhắn</a><a href="/orders">Đơn hàng</a><a href="/sell">Đăng tin</a></nav>
    {id === 'loading' ? <p>Đang tải...</p> : session ? <div key={id}>{children(session)}</div> : <section className="member-card"><h1>Đăng nhập để tiếp tục</h1><p>Dữ liệu cá nhân chỉ hiển thị cho tài khoản của bạn.</p><a className="member-button" href={'/login?next=' + encodeURIComponent(typeof window === 'undefined' ? '/account' : window.location.pathname + window.location.search)}>Đăng nhập</a></section>}
  </main>;
}
