'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { SupportChat } from './SupportChat';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/adminttt') || pathname?.startsWith('/admin');
  const [maintenance, setMaintenance] = useState(false);
  useEffect(() => { if (isAdmin) return; fetch('/api/v1/system/config').then(r => r.json()).then(j => setMaintenance(!!j?.data?.maintenanceMode)).catch(() => undefined); }, [isAdmin, pathname]);

  return (
    <>
      <a className="skip-link" href="#home">Đến nội dung chính</a>
      {!isAdmin && maintenance && <div role="status" style={{ background: '#b45309', color: '#fff', textAlign: 'center', padding: '8px 12px', fontSize: 13.5, fontWeight: 600 }}>Hệ thống đang bảo trì: bạn vẫn xem được tin đăng nhưng tạm thời chưa thể đăng ký, đăng tin, đặt hàng hay nhắn tin.</div>}
      {!isAdmin && <AppHeader />}
      <div className={!isAdmin ? 'page-content-wrapper-mobile' : ''}>
        {children}
      </div>
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileBottomNav />}
      {!isAdmin && <SupportChat />}
    </>
  );
}
