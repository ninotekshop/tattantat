import type { MetadataRoute } from 'next';
import { CATEGORY_ENGINE_TAXONOMY } from '../lib/marketplace';
import { SEO_AREAS, findLandingCategory, landingHref, serverApiGet, siteUrl } from '../lib/seo-landing';

// Tạo lại khi có yêu cầu (không đóng băng lúc build - khi đó backend chưa chạy nên danh sách tin bị rỗng).
export const dynamic = 'force-dynamic';

type Row = { id: string; updated: string; cats?: string[]; areas?: string[] };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();
  const fixed: MetadataRoute.Sitemap = [
    ...['', '/bat-dong-san', '/o-to'].map(p => ({ url: site + p, changeFrequency: 'daily' as const, priority: p === '' ? 1 : 0.8 })),
    ...CATEGORY_ENGINE_TAXONOMY.map(c => ({ url: `${site}/categories?cat=${encodeURIComponent(c.key)}`, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...['/about', '/contact', '/safety-guide', '/posting-rules', '/terms', '/privacy', '/regulations'].map(p => ({ url: site + p, changeFrequency: 'monthly' as const, priority: 0.3 })),
  ];
  const rows = await serverApiGet<Row[]>('/search/sitemap', 3600, 5000);
  if (!Array.isArray(rows)) return fixed;

  // Trang đích /mua-ban/<danh-muc>[/<khu-vuc>]: chỉ đưa vào sitemap những trang đang có tin (tránh trang rỗng).
  const landing = new Map<string, Date>();
  const areaSlugs = new Set<string>(SEO_AREAS.map(a => a.slug));
  for (const r of rows) {
    const updated = new Date(r.updated);
    for (const cat of r.cats ?? []) {
      if (!findLandingCategory(cat)) continue;
      for (const path of [landingHref(cat), ...(r.areas ?? []).filter(a => areaSlugs.has(a)).map(a => landingHref(cat, a))]) {
        const prev = landing.get(path);
        if (!prev || prev < updated) landing.set(path, updated);
      }
    }
  }
  return [
    ...fixed,
    ...[...landing].map(([path, lastModified]) => ({ url: site + path, lastModified, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...rows.map(p => ({ url: `${site}/products/${p.id}`, lastModified: new Date(p.updated), changeFrequency: 'weekly' as const, priority: 0.7 })),
  ];
}
