'use client';

import { Search, PlusCircle, UserRound } from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, readSession } from '../lib/auth';

function subscribeSession(listener:()=>void) {
  window.addEventListener('storage',listener);window.addEventListener('tattantat-auth-change',listener);
  return()=>{window.removeEventListener('storage',listener);window.removeEventListener('tattantat-auth-change',listener);};
}

export function AppHeader() {
  const router = useRouter();
  const name=useSyncExternalStore(subscribeSession,()=>readSession()?.user.fullName??'',()=> '');
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get('q') ?? '').trim();
    router.push('/?q=' + encodeURIComponent(query) + '#products');
  }
  return <header className="header-main">
    <Link className="logo-area" href="/" aria-label="Tất Tần Tật - Trang chủ"><img src="/TatTanTat_logo_horizontal.svg" alt="Tất Tần Tật - Mua bán mọi thứ, gần bạn" width="208" height="60" /></Link>
    <form className="search-bar" role="search" onSubmit={search}>
      <input name="q" aria-label="Tìm sản phẩm" placeholder="Bạn đang tìm gì? (ví dụ: iPhone, laptop, nhà đất,...)" maxLength={200} />
      <button type="submit" aria-label="Tìm kiếm"><Search size={21} /></button>
    </form>
    <div className="user-actions">
      <Link className="btn-post" href="/sell"><PlusCircle size={19} /> <span>Đăng tin</span></Link>
      <Link className="btn-text" href={name?'/account':'/login'} aria-label={name?'Tài khoản của '+name:'Đăng nhập'}><UserRound size={20} /><span>{name?'Tài khoản':'Đăng nhập'}</span></Link>
      {name?<button type="button" className="btn-text register-link" onClick={()=>{clearSession();router.replace('/login');}}>Đăng xuất</button>:<Link className="btn-text register-link" href="/register"><UserRound size={20} /><span>Đăng ký</span></Link>}
    </div>
  </header>;
}
