'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationBell } from './NotificationBell';
import { clearSession, readSessionSnapshot } from '../lib/auth';
import { Home, PlusCircle, Heart, MessageSquare, User, LogOut, FileText, Search, Wallet, ShoppingBag } from 'lucide-react';
import { AuthModal } from './AuthModal';

function subscribeSession(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', listener);
  window.addEventListener('tattantat-auth-change', listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener('tattantat-auth-change', listener);
  };
}

export function AppHeader() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const session = useSyncExternalStore(subscribeSession, readSessionSnapshot, () => null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const name = mounted && session?.user.fullName ? session.user.fullName : '';

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'PHONE'>('LOGIN');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  // Bấm ra ngoài menu hoặc nhấn Esc thì tự đóng
  useEffect(() => {
    if (!profileDropdownOpen) return;
    const onPointer = (e: MouseEvent | TouchEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileDropdownOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setProfileDropdownOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('touchstart', onPointer); document.removeEventListener('keydown', onKey); };
  }, [profileDropdownOpen]);

  const requireAuth = (path: string, mode: 'LOGIN' | 'REGISTER' = 'LOGIN') => {
    if (session) {
      router.push(path);
    } else {
      setAuthMode(mode);
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <header className="topbar">
        <div className="shell topbar-inner">
          <Link className="brand" href="/" title="Tất Tần Tật - Mua bán mọi thứ, gần bạn">
            <img src="/assets/logo.png" alt="Tất Tần Tật - Mua bán mọi thứ, gần bạn" className="header-logo-img" />
          </Link>

          {/* MOBILE HEADER SEARCH BAR */}
          <div className="mobile-header-search" onClick={() => router.push('/categories')}>
            <Search size={16} color="#00a65a" />
            <input
              type="text"
              placeholder="Tìm sản phẩm, dịch vụ..."
              readOnly
            />
          </div>

          <nav className="main-nav desktop-only-nav">
            <Link className="nav-link active" href="/"><Home size={18} /><span>Trang chủ</span></Link>
            <button className="nav-link" onClick={() => requireAuth('/favorites')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Heart size={18} /><span>Yêu thích</span>
            </button>
            <button className="nav-link" onClick={() => requireAuth('/messages')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <MessageSquare size={18} /><span>Tin nhắn</span>
            </button>
            <button className="nav-link" onClick={() => requireAuth('/account')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <User size={18} /><span>{name ? name : 'Tài khoản'}</span>
            </button>
          </nav>

          <div className="top-actions">
            <button onClick={() => requireAuth('/sell')} className="topbar-sell-cta desktop-only-btn" style={{ cursor: 'pointer', border: 'none' }}>
              <PlusCircle size={18} className="topbar-sell-icon" /> ĐĂNG TIN MIỄN PHÍ
            </button>

            <NotificationBell />

            {name ? (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  className="user-avatar"
                  aria-haspopup="menu"
                  aria-expanded={profileDropdownOpen}
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  title="Tài khoản cá nhân"
                >
                  {session?.user.avatarUrl ? <img src={session.user.avatarUrl} alt={name} className="user-avatar-img" /> : name.substring(0, 2).toUpperCase()}
                </button>

                {profileDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                    width: 200,
                    zIndex: 1000,
                    padding: '8px 0',
                    overflow: 'hidden'
                  }}>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                      {name}
                    </div>
                    <Link href="/account" onClick={() => setProfileDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                      <FileText size={16} /> Tin đăng của tôi
                    </Link>
                    <Link href="/orders" onClick={() => setProfileDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                      <ShoppingBag size={16} /> Đơn hàng của tôi
                    </Link>
                    <Link href="/vi-tien" onClick={() => setProfileDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                      <Wallet size={16} /> Ví & gói của tôi
                    </Link>
                    <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
                    <button
                      onClick={() => {
                        clearSession();
                        setProfileDropdownOpen(false);
                        router.push('/');
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#dc2626', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="user-avatar"
                onClick={() => { setAuthMode('LOGIN'); setAuthModalOpen(true); }}
                title="Đăng nhập"
              >
                <User size={18} />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
