'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, readSessionSnapshot } from '../lib/auth';
import { Home, PlusCircle, Heart, MessageSquare, User, Bell, LogOut, FileText } from 'lucide-react';
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
  const session = useSyncExternalStore(subscribeSession, readSessionSnapshot, () => null);
  const name = session?.user.fullName ?? '';

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'PHONE'>('LOGIN');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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

          <nav className="main-nav">
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
            <button onClick={() => requireAuth('/sell')} className="topbar-sell-cta" style={{ cursor: 'pointer', border: 'none' }}>
              <PlusCircle size={18} className="topbar-sell-icon" /> ĐĂNG TIN MIỄN PHÍ
            </button>

            <button className="bell-btn" onClick={() => requireAuth('/account')} title="Thông báo">
              <Bell size={20} />
              <span className="bell-badge">3</span>
            </button>

            {name ? (
              <div style={{ position: 'relative' }}>
                <button
                  className="user-avatar"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  title="Tài khoản cá nhân"
                >
                  {name.substring(0, 2).toUpperCase()}
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
                      <User size={16} /> Hồ sơ cá nhân
                    </Link>
                    <Link href="/account" onClick={() => setProfileDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                      <FileText size={16} /> Tin đăng của tôi
                    </Link>
                    <Link href="/favorites" onClick={() => setProfileDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                      <Heart size={16} /> Tin đã lưu
                    </Link>
                    <Link href="/messages" onClick={() => setProfileDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
                      <MessageSquare size={16} /> Tin nhắn
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
