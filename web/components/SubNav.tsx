'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, House, MapPin, Menu } from 'lucide-react';
import { InfoDialog } from './InfoDialog';

export function SubNav() {
  const pathname = usePathname();
  return <nav className="subnav" aria-label="Điều hướng chính">
    <Link href="/categories" className="nav-categories"><Menu size={21} /> Danh mục <ChevronDown size={13} /></Link>
    <div className="subnav-links">
      <Link href="/" className={pathname === '/' ? 'active' : ''}><House size={16} fill="currentColor" /> Trang chủ</Link>
      <Link href="/?sort=newest#products">Tin mới</Link>
      <Link href="/#discover">Khám phá</Link>
      <Link href="/?view=shops#products">Cửa hàng</Link>
      <Link href="/#news">Bài viết</Link>
      <InfoDialog title="Trung tâm trợ giúp" trigger="Hỗ trợ"><p>Chọn một sản phẩm để xem thông tin người bán. Đăng nhập để sử dụng tài khoản của bạn. Khi giao dịch, không chia sẻ mật khẩu hoặc mã OTP và luôn kiểm tra sản phẩm trước khi nhận.</p></InfoDialog>
    </div>
    <span className="nav-location"><MapPin size={16} /> Toàn quốc</span>
  </nav>;
}
