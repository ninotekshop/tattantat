import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import './marketplace.css';
import './member.css';
import './dog-theme.css';
import { ClientLayout } from '../components/ClientLayout';
import Script from 'next/script';

// Mã đo lường Google Analytics 4 của tattantat.vn.
const GA_ID = 'G-DDY617R0XL';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  // Địa chỉ gốc để ghép các đường dẫn tương đối (ảnh chia sẻ...) thành https://tattantat.vn/... thay vì địa chỉ nội bộ của máy chủ.
  metadataBase: new URL((process.env.NEXT_PUBLIC_SITE_URL || 'https://tattantat.vn').replace(/\/$/, '')),
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
        <Script id="gtag-init" strategy="afterInteractive">{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}');`}</Script>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      </body>
    </html>
  );
}
