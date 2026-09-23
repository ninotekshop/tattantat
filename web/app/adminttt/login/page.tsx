'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/adminttt');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#002117', color: '#fff' }}>
      Đang chuyển hướng đến cổng Đăng nhập Quản trị AdminTTT...
    </div>
  );
}
