import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import './marketplace.css';
import './member.css';
import './dog-theme.css';
import { ClientLayout } from '../components/ClientLayout';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tất Tần Tật - Mua bán mọi thứ, gần bạn',
  description: 'Mua bán mọi thứ, đơn giản và an toàn.',
  openGraph: {
    title: 'Tất Tần Tật - Mua bán mọi thứ, gần bạn',
    description: 'Mua bán mọi thứ, đơn giản và an toàn.',
    images: [{ url: 'https://tattantat.vn/og-image.jpg?v=2', width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
