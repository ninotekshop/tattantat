import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tất Tần Tật — Mua bán dễ dàng', short_name: 'Tất Tần Tật', description: 'Sàn mua bán, rao vặt an toàn với thanh toán đảm bảo.',
    start_url: '/', display: 'standalone', background_color: '#ffffff', theme_color: '#00a65a', lang: 'vi',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }],
  };
}
