import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Tin yêu thích | Tất Tần Tật',
  description: 'Danh sách tin đăng bạn đã lưu trên Tất Tần Tật.',
  robots: { index: false, follow: false },
};

export default function FavoritesLayout({ children }: { children: ReactNode }) {
  return children;
}
