'use client';
import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/adminttt') || pathname?.startsWith('/admin');

  return (
    <>
      <a className="skip-link" href="#home">Đến nội dung chính</a>
      {!isAdmin && <AppHeader />}
      <div className={!isAdmin ? 'page-content-wrapper-mobile' : ''}>
        {children}
      </div>
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileBottomNav />}
    </>
  );
}
