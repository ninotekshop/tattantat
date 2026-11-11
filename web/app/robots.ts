import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  // Mặc định là tên miền thật: máy chủ build từ GitHub không có tệp .env.production nên không được rơi về localhost.
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tattantat.vn').replace(/\/$/, '');
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/adminttt', '/admin', '/account', '/orders', '/messages', '/notifications', '/vi-tien', '/goi-dich-vu', '/xac-minh', '/thanh-toan', '/api/'] }], sitemap: `${site}/sitemap.xml` };
}
