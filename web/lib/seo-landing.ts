// Trang đích SEO theo danh mục + khu vực: /mua-ban/<danh-muc>[/<khu-vuc>]
import { CATEGORY_ENGINE_TAXONOMY, type ParentCategorySpec, type SubCategorySpec } from './marketplace';

export const SEO_AREAS = [
  { slug: 'quy-nhon', label: 'Quy Nhơn' },
  { slug: 'binh-dinh', label: 'Bình Định' },
  { slug: 'gia-lai', label: 'Gia Lai' },
] as const;

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://tattantat.vn').replace(/\/$/, '');

export type LandingTarget = { parent: ParentCategorySpec; sub: SubCategorySpec | null; slug: string; name: string };

export function findLandingCategory(slug: string): LandingTarget | null {
  for (const parent of CATEGORY_ENGINE_TAXONOMY) {
    if (parent.slug === slug) return { parent, sub: null, slug, name: parent.label };
    const sub = parent.subCategories.find(s => s.slug === slug);
    if (sub) return { parent, sub, slug, name: sub.name };
  }
  return null;
}

export const landingHref = (catSlug: string, areaSlug?: string) => `/mua-ban/${catSlug}${areaSlug ? `/${areaSlug}` : ''}`;

/** Gọi API từ máy chủ Next: thử địa chỉ nội bộ trước, rồi địa chỉ công khai. Lỗi thì trả null. */
export async function serverApiGet<T>(path: string, revalidate = 300, timeoutMs = 4000): Promise<T | null> {
  const bases = [process.env.API_INTERNAL_BASE_URL, process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_API_BASE_URL, `${siteUrl()}/api/v1`]
    .map(b => (b ?? '').replace(/\/$/, ''))
    .filter((b, i, a) => /^https?:\/\//i.test(b) && a.indexOf(b) === i);
  for (const base of bases) {
    try {
      const res = await fetch(base + path, { next: { revalidate }, signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) continue;
      const j = await res.json() as { success?: boolean; data?: T };
      if (j?.success && j.data !== undefined) return j.data;
    } catch { /* thử địa chỉ tiếp theo */ }
  }
  return null;
}
