import type { Metadata } from 'next';
import { cache, type ReactNode } from 'react';
import { getBaseUrl } from '../../../lib/api';

type P = { id: string; title: string; price: string; description?: string | null; imageUrl?: string; images?: string[]; location?: string; condition?: string | null };
const site = () => (process.env.NEXT_PUBLIC_SITE_URL || 'https://tattantat.vn').replace(/\/$/, '');
const abs = (u?: string | null) => (u ? (/^https?:\/\//i.test(u) ? u : site() + (u.startsWith('/') ? '' : '/') + u) : undefined);
const load = cache(async (id: string): Promise<P | null> => {
  // Thử địa chỉ API nội bộ trước, rồi địa chỉ công khai; mỗi lần chờ tối đa 2 giây để trang không bị treo khi trình thu thập (Facebook, Zalo…) tải.
  const bases = [getBaseUrl(), `${site()}/api/v1`].map(b => b.replace(/\/$/, '')).filter((b, i, a) => /^https?:\/\//i.test(b) && a.indexOf(b) === i);
  for (const base of bases) {
    try {
      const res = await fetch(`${base}/products/${encodeURIComponent(id)}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(2000) });
      if (!res.ok) continue;
      const j = await res.json();
      if (j?.success) return j.data as P;
    } catch { /* thử địa chỉ tiếp theo */ }
  }
  return null;
});
const clip = (s: string, n: number) => s.replace(/\s+/g, ' ').trim().slice(0, n);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await load((await params).id);
  if (!p) return { title: 'Tin đăng | Tất Tần Tật', robots: { index: false } };
  const price = /^\d+(\.0+)?$/.test(p.price) ? `${Number(p.price).toLocaleString('vi-VN')}\u00a0đ` : '';
  const title = clip(`${p.title}${price ? ` - ${price}` : ''}`, 70);
  const description = clip(p.description || `${p.title}${p.location ? ` tại ${p.location}` : ''}. Mua bán an toàn trên Tất Tần Tật.`, 160);
  return { title, description, alternates: { canonical: `${site()}/products/${p.id}` }, openGraph: { title, description, type: 'website', siteName: 'Tất Tần Tật', locale: 'vi_VN', url: `${site()}/products/${p.id}` }, twitter: { card: 'summary_large_image', title, description } };
}

export default async function ProductLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const p = await load((await params).id);
  const ld = p && /^\d+(\.0+)?$/.test(p.price) ? { '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: clip(p.description ?? p.title, 300), image: p.images?.length ? p.images.map(x => abs(x)) : p.imageUrl ? [abs(p.imageUrl)] : undefined, offers: { '@type': 'Offer', priceCurrency: 'VND', price: Number(p.price), availability: 'https://schema.org/InStock', url: `${site()}/products/${p.id}` } } : null;
  return <>{ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}{children}</>;
}
