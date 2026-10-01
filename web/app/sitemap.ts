import type { MetadataRoute } from 'next';
import { getBaseUrl } from '../lib/api';

export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
  const fixed = ['', '/bat-dong-san', '/o-to', '/about', '/safety-guide', '/posting-rules', '/terms', '/privacy', '/regulations'].map(p => ({ url: site + p, changeFrequency: 'daily' as const, priority: p === '' ? 1 : 0.4 }));
  try {
    const res = await fetch(`${getBaseUrl().replace(/\/$/, '')}/search/sitemap`, { next: { revalidate: 3600 } });
    const j = await res.json() as { data?: { id: string; updated: string }[] };
    return [...fixed, ...(j.data ?? []).map(p => ({ url: `${site}/products/${p.id}`, lastModified: new Date(p.updated), changeFrequency: 'weekly' as const, priority: 0.7 }))];
  } catch { return fixed; }
}
