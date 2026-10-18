import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Đăng tin bán hàng miễn phí | Tất Tần Tật',
  description: 'Đăng tin mua bán miễn phí trên Tất Tần Tật: thêm ảnh, mô tả và giá, tiếp cận người mua gần bạn chỉ trong vài phút.',
  alternates: { canonical: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tattantat.vn').replace(/\/$/, '') + '/sell' },
};

export default function SellLayout({ children }: { children: ReactNode }) {
  return children;
}
