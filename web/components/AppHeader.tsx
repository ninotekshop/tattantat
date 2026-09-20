'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, readSession } from '../lib/auth';

function subscribeSession(listener:()=>void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage',listener);window.addEventListener('tattantat-auth-change',listener);
  return()=>{window.removeEventListener('storage',listener);window.removeEventListener('tattantat-auth-change',listener);};
}

export function AppHeader() {
  const router = useRouter();
  const name=useSyncExternalStore(subscribeSession,()=>readSession()?.user.fullName??'',()=> '');
  return <header className="topbar">
    <div className="shell topbar-inner">
      <button className="icon-btn mobile-menu" aria-label="Mở menu">☰</button>
      <Link className="brand" href="/">
        <img src="/assets/logo.png" alt="Tất Tần Tật" />
      </Link>
      <nav className="main-nav">
        <Link className="active" href="/">Trang chủ</Link>
        <Link href="/categories">Danh mục</Link>
        <Link href="/#new">Tin mới</Link>
        <Link href="/sell">Đăng tin</Link>
        <Link href="/messages">Tin nhắn</Link>
      </nav>
      <div className="top-actions">
        {name ? (
           <>
             <Link href="/account" className="ghost-btn">♙ <span>{name}</span></Link>
             <button onClick={() => { clearSession(); router.replace('/login'); }} className="ghost-btn">Đăng xuất</button>
             <Link href="/sell" className="primary-btn">＋ Đăng tin</Link>
             <div className="avatar">{name.substring(0, 2).toUpperCase()}</div>
           </>
        ) : (
           <>
             <Link href="/login" className="ghost-btn">♙ <span>Đăng nhập</span></Link>
             <Link href="/register" className="ghost-btn">Đăng ký</Link>
             <Link href="/sell" className="primary-btn">＋ Đăng tin</Link>
           </>
        )}
      </div>
    </div>
  </header>;
}
