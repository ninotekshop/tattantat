import type { Metadata } from 'next';
import './globals.css';
import './marketplace.css';
import './member.css';
import './dog-theme.css';
import { ClientLayout } from '../components/ClientLayout';

export const metadata: Metadata = {
  title: 'Tất Tần Tật - Mua bán mọi thứ, gần bạn',
  description: 'Mua bán mọi thứ, đơn giản và an toàn.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
