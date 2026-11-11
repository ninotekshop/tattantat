import type { MetadataRoute } from 'next';
import { getBaseUrl } from '../lib/api';
import { CATEGORY_ENGINE_TAXONOMY } from '../lib/marketplace';

// Tạo lại khi có yêu cầu (không đóng băng lúc build - khi đó backend chưa chạy nên danh sách tin bị rỗng).
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Mặc định là tên miền thật: máy chủ build từ GitHub không có tệp .env.production nên không được rơi về localhost.
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tattantat.vn').replace(/\/$/, '');
  const fixed: MetadataRoute.Sitemap = [
    ...['', '/bat-dong-san', '/o-to'].map(p => ({ url: site + p, changeFrequency: 'daily' as const, priority: p === '' ? 1 : 0.8 })),
    ...CATEGORY_ENGINE_TAXONOMY.map(c => ({ url: `${site}/categories?cat=${encodeURIComponent(c.key)}`, changeFrequency: 'daily' as const, priority: 0.8 })),
    ...['/about', '/safety-guide', '/posting-rules', '/terms', '/privacy', '/regulations'].map(p => ({ url: site + p, changeFrequency: 'monthly' as const, priority: 0.3 })),
  ];
  // Thử địa chỉ API nội bộ trước, rồi địa chỉ công khai; bỏ qua địa chỉ tương đối (/api/v1) vì máy chủ không gọi được.
  const bases = [process.env.API_INTERNAL_BASE_URL, getBaseUrl(), `${site}/api/v1`]
    .map(b => (b ?? '').replace(/\/$/, ''))
    .filter((b, i, a) => /^https?:\/\//i.test(b) && a.indexOf(b) === i);
  for (const base of bases) {
    try {
      const res = await fetch(`${base}/search/sitemap`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const j = await res.json() as { data?: { id: string; updated: string }[] };
      if (!Array.isArray(j.data)) continue;
      return [...fixed, ...j.data.map(p => ({ url: `${site}/products/${p.id}`, lastModified: new Date(p.updated), changeFrequency: 'weekly' as const, priority: 0.7 }))];
    } catch { /* thử địa chỉ tiếp theo */ }
  }
  return fixed;
}
