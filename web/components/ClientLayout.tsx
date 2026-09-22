'use client';
import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <>
      <a className="skip-link" href="#home">Đến nội dung chính</a>
      {!isAdmin && <AppHeader />}
      {children}
      {!isAdmin && <Footer />}
    </>
  );
}
