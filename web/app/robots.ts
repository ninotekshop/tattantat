import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/adminttt', '/admin', '/account', '/orders', '/messages', '/notifications', '/vi-tien', '/goi-dich-vu', '/xac-minh', '/thanh-toan', '/api/'] }], sitemap: `${site}/sitemap.xml` };
}
