'use client';
import '../app/account/account.css';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { BadgeCheck, Ban, Bell, BarChart3, Bookmark, ChevronRight, FileText, Heart, Mail, MessageCircle, Phone, PlusCircle, ShieldCheck, ShoppingBag, SlidersHorizontal, PanelLeftClose, PanelLeftOpen, User, Wallet, type LucideIcon } from 'lucide-react';
import { memberRequest } from '../lib/api';
import type { WebSession } from '../lib/auth';

type Me = { full_name: string; avatar_url?: string | null; email: string | null; phone: string | null; phone_verified: boolean };
type Item = { key: string; href: string; label: string; icon: LucideIcon };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: 'Tài khoản', items: [
    { key: 'account:profile', href: '/account?section=profile', label: 'Hồ sơ', icon: User },
    { key: 'account:listings', href: '/account?section=listings', label: 'Tin đã đăng', icon: FileText },
    { key: 'account:searches', href: '/account?section=searches', label: 'Tìm kiếm đã lưu', icon: Bookmark },
    { key: 'account:prefs', href: '/account?section=prefs', label: 'Cài đặt thông báo', icon: SlidersHorizontal },
    { key: 'account:blocks', href: '/account?section=blocks', label: 'Đã chặn', icon: Ban },
    { key: '/xac-minh', href: '/xac-minh', label: 'Xác minh tài khoản', icon: ShieldCheck },
  ] },
  { title: 'Mua bán', items: [
    { key: '/orders', href: '/orders', label: 'Đơn hàng', icon: ShoppingBag },
    { key: '/vi-tien', href: '/vi-tien', label: 'Ví & gói', icon: Wallet },
    { key: '/thong-ke', href: '/thong-ke', label: 'Thống kê bán hàng', icon: BarChart3 },
  ] },
  { title: 'Tương tác', items: [
    { key: '/messages', href: '/messages', label: 'Tin nhắn', icon: MessageCircle },
    { key: '/notifications', href: '/notifications', label: 'Thông báo', icon: Bell },
    { key: '/favorites', href: '/favorites', label: 'Yêu thích', icon: Heart },
  ] },
];

function Inner({ session, children }: { session: WebSession; children: ReactNode }) {
  const path = usePathname() ?? '';
  const sp = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { const load = () => memberRequest<Me>('/me').then(setMe).catch(() => undefined); load(); window.addEventListener('tt-profile-updated', load); return () => window.removeEventListener('tt-profile-updated', load); }, []);
  const active = path.startsWith('/account') ? 'account:' + (sp.get('section') || 'profile') : path.replace(/\/$/, '');
  const shown = me?.full_name || session.user.fullName || '';
  const initials = shown.trim().split(/\s+/).slice(-2).map(w => w[0]?.toUpperCase()).join('') || 'TT';
  const compact = path.startsWith('/messages');
  const [pref, setPref] = useState<string | null>(null);
  useEffect(() => { try { setPref(localStorage.getItem('tt-account-menu')); } catch { /* không có localStorage */ } }, []);
  const collapsed = pref ? pref === 'collapsed' : compact;
  const toggleMenu = () => { const next = collapsed ? 'open' : 'collapsed'; setPref(next); try { localStorage.setItem('tt-account-menu', next); } catch { /* bỏ qua */ } };
  return <div className={'ac-page' + (compact ? ' ac-compact' : '') + (collapsed ? ' ac-collapsed' : '')}>
    {!compact && <header className="ac-hero ac-hero-slim">
      <div className="ac-avatar" aria-hidden="true">{(me?.avatar_url ?? session.user.avatarUrl) ? <img src={(me?.avatar_url ?? session.user.avatarUrl) as string} alt="" /> : initials}</div>
      <div className="ac-who">
        <p className="ac-hello">Xin chào,</p>
        <h1>{shown || 'Tài khoản của bạn'}</h1>
        <div className="ac-contact">
          <span><Mail size={15} />{me?.email || 'Chưa cập nhật email'}</span>
          <span><Phone size={15} />{me?.phone || 'Chưa có số điện thoại'}{me?.phone_verified && <em className="ac-ok"><BadgeCheck size={14} />Đã xác minh</em>}</span>
        </div>
      </div>
      <Link className="ac-post" href="/sell"><PlusCircle size={18} />Đăng tin</Link>
    </header>}
    <div className="ac-layout">
      <aside className="ac-side" aria-label="Khu vực cá nhân">
        <nav className="ac-tabs">
          <button type="button" className="ac-toggle" onClick={toggleMenu} aria-expanded={!collapsed} title={collapsed ? 'Hiện menu' : 'Ẩn menu'}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}<span className="ac-lbl">Ẩn menu</span></button>
          {GROUPS.map(g => <div className="ac-group" key={g.title}>
            <p>{g.title}</p>
            {g.items.map(it => <Link key={it.key} href={it.href} className={'ac-tab' + (active === it.key ? ' on' : '')} title={it.label} aria-current={active === it.key ? 'page' : undefined}><it.icon size={18} /><span className="ac-lbl">{it.label}</span><ChevronRight size={15} className="ac-arrow" /></Link>)}
          </div>)}
        </nav>
      </aside>
      <div className="ac-main">{children}</div>
    </div>
  </div>;
}

/** Bố cục chung của khu vực cá nhân: banner hồ sơ + menu bên trái, các trang con nằm trong khung nội dung. */
export function AccountShell({ session, children }: { session: WebSession; children: ReactNode }) {
  return <Suspense fallback={null}><Inner session={session}>{children}</Inner></Suspense>;
}
