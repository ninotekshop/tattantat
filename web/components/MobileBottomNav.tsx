'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, MessageSquare, User } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="Điều hướng di động">
      <Link href="/" className={`mobile-nav-item ${pathname === '/' ? 'active' : ''}`}>
        <Home size={22} />
        <span>Trang chủ</span>
      </Link>
      <Link href="/account" className={`mobile-nav-item ${pathname === '/account' ? 'active' : ''}`}>
        <Compass size={22} />
        <span>Quản lý tin</span>
      </Link>
      <Link href="/sell" className="mobile-nav-fab" aria-label="Đăng tin">
        <div className="fab-circle">
          <Plus size={28} color="#fff" />
        </div>
        <span>Đăng tin</span>
      </Link>
      <Link href="/messages" className={`mobile-nav-item ${pathname === '/messages' ? 'active' : ''}`}>
        <MessageSquare size={22} />
        <span>Liên hệ</span>
      </Link>
      <Link href="/account" className={`mobile-nav-item ${pathname === '/account' ? 'active' : ''}`}>
        <User size={22} />
        <span>Tài khoản</span>
      </Link>
    </nav>
  );
}
