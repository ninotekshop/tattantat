'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, readSession } from '../lib/auth';
import { Home, PlusCircle, Heart, MessageSquare, User, MapPin, Bell, ChevronDown } from 'lucide-react';

function subscribeSession(listener:()=>void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage',listener);window.addEventListener('tattantat-auth-change',listener);
  return()=>{window.removeEventListener('storage',listener);window.removeEventListener('tattantat-auth-change',listener);};
}

export function AppHeader() {
  const router = useRouter();
  const name=useSyncExternalStore(subscribeSession,()=>readSession()?.user.fullName??'',()=> '');

  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link className="brand" href="/">
          <img src="/assets/logo.png" alt="Tất Tần Tật - Mua bán mọi thứ, gần bạn" className="header-logo-img" />
        </Link>

        <nav className="main-nav">
          <Link className="nav-link active" href="/"><Home size={18} /><span>Trang chủ</span></Link>
          <Link className="nav-link" href="/sell"><PlusCircle size={18} /><span>Đăng tin</span></Link>
          <Link className="nav-link" href="/favorites"><Heart size={18} /><span>Yêu thích</span></Link>
          <Link className="nav-link" href="/messages"><MessageSquare size={18} /><span>Tin nhắn</span></Link>
          <Link className="nav-link" href={name ? "/account" : "/login"}><User size={18} /><span>Tài khoản</span></Link>
        </nav>

        <div className="top-actions">
          <button className="location-picker">
            <MapPin size={15} /> Bình Định (Gia Lai mới) <ChevronDown size={14} />
          </button>

          <button className="bell-btn" onClick={() => router.push('/account')}>
            <Bell size={20} />
            <span className="bell-badge">3</span>
          </button>

          {name ? (
            <button className="user-avatar" onClick={() => { clearSession(); router.replace('/login'); }} title="Đăng xuất">
              {name.substring(0, 2).toUpperCase()}
            </button>
          ) : (
            <button className="user-avatar" onClick={() => router.push('/login')} title="Đăng nhập">
              <User size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
