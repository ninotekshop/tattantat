import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getBaseUrl } from '../../../lib/api';

type P = { id: string; title: string; price: string; description?: string | null; imageUrl?: string; images?: string[]; location?: string; condition?: string | null };
const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
async function load(id: string): Promise<P | null> {
  try {
    const res = await fetch(`${getBaseUrl().replace(/\/$/, '')}/products/${encodeURIComponent(id)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null; const j = await res.json(); return j?.success ? j.data as P : null;
  } catch { return null; }
}
const clip = (s: string, n: number) => s.replace(/\s+/g, ' ').trim().slice(0, n);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = await load((await params).id);
  if (!p) return { title: 'Tin đăng | Tất Tần Tật', robots: { index: false } };
  const price = /^\d+(\.0+)?$/.test(p.price) ? `${Number(p.price).toLocaleString('vi-VN')}\u00a0đ` : '';
  const title = clip(`${p.title}${price ? ` - ${price}` : ''}`, 70);
  const description = clip(p.description || `${p.title}${p.location ? ` tại ${p.location}` : ''}. Mua bán an toàn trên Tất Tần Tật.`, 160);
  const image = p.images?.[0] ?? p.imageUrl;
  return { title, description, alternates: { canonical: `${site()}/products/${p.id}` }, openGraph: { title, description, type: 'website', url: `${site()}/products/${p.id}`, images: image ? [{ url: image }] : undefined }, twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined } };
}

export default async function ProductLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const p = await load((await params).id);
  const ld = p && /^\d+(\.0+)?$/.test(p.price) ? { '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: clip(p.description ?? p.title, 300), image: p.images?.length ? p.images : p.imageUrl ? [p.imageUrl] : undefined, offers: { '@type': 'Offer', priceCurrency: 'VND', price: Number(p.price), availability: 'https://schema.org/InStock', url: `${site()}/products/${p.id}` } } : null;
  return <>{ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}{children}</>;
}
