import type { Metadata } from 'next';
import './globals.css';
import './marketplace.css';
import './member.css';
import './dog-theme.css';
import { AppHeader } from '../components/AppHeader';
import { SubNav } from '../components/SubNav';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Tất Tần Tật - Mua bán mọi thứ, gần bạn',
  description: 'Mua bán mọi thứ, đơn giản và an toàn.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <a className="skip-link" href="#home">Đến nội dung chính</a>
        <AppHeader />
        {children}
        <Footer />
      </body>
    </html>
  );
}
