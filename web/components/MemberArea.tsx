'use client';

import { useState, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { readSession, type WebSession } from '../lib/auth';

function subscribe(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', listener);
  window.addEventListener('tattantat-auth-change', listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener('tattantat-auth-change', listener);
  };
}

export function MemberArea({ children }: { children: (session: WebSession) => ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const sessionStore = useSyncExternalStore(subscribe, readSession, () => null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const session = mounted ? sessionStore : null;

  return (
    <main id="main-content" className="member-page">
      <nav aria-label="Khu vực cá nhân" className="member-nav">
        <Link href="/account">Tài khoản</Link>
        <Link href="/messages">Tin nhắn</Link>
        <Link href="/orders">Đơn hàng</Link>
        <Link href="/sell">Đăng tin</Link>
      </nav>
      {!mounted ? (
        <p style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Đang tải...</p>
      ) : session ? (
        <div key={session.user.id}>{children(session)}</div>
      ) : (
        <section className="member-card">
          <h1>Đăng nhập để tiếp tục</h1>
          <p>Dữ liệu cá nhân chỉ hiển thị cho tài khoản của bạn.</p>
          <Link className="member-button" href="/login">Đăng nhập</Link>
        </section>
      )}
    </main>
  );
}
