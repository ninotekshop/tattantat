import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ProductCard } from '../../../components/MarketplaceHome';
import type { Product } from '../../../lib/api';
import { SEO_AREAS, findLandingCategory, landingHref, serverApiGet, siteUrl } from '../../../lib/seo-landing';

type Params = Promise<{ slug: string[] }>;
type Result = { items: Product[]; total: number };

function resolve(slug: string[]) {
  if (slug.length < 1 || slug.length > 2) return null;
  const target = findLandingCategory(slug[0]);
  if (!target) return null;
  const area = slug[1] ? SEO_AREAS.find(a => a.slug === slug[1]) : undefined;
  if (slug[1] && !area) return null;
  return { target, area };
}

const load = cache(async (catSlug: string, location: string): Promise<Result | null> => {
  const qs = new URLSearchParams({ categorySlug: catSlug, sort: 'new', limit: '48' });
  if (location) qs.set('location', location);
  return serverApiGet<Result>(`/search/products?${qs}`);
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = resolve((await params).slug);
  if (!r) return { title: 'Không tìm thấy trang | Tất Tần Tật', robots: { index: false } };
  const { target, area } = r;
  const data = await load(target.slug, area?.label ?? '');
  const where = area ? ` tại ${area.label}` : '';
  const title = `Mua bán ${target.name}${where} - Tin mới, giá tốt | Tất Tần Tật`;
  const description = `${data?.total ? `${data.total} tin` : 'Tin'} mua bán ${target.name.toLowerCase()} cũ và mới${where}. Xem giá, hình thật, chat trực tiếp với người bán. Đăng tin miễn phí trên Tất Tần Tật.`;
  const url = siteUrl() + landingHref(target.slug, area?.slug);
  return {
    title, description,
    alternates: { canonical: url },
    // Trang chưa có tin thì chưa cho Google lập chỉ mục (tránh trang rỗng), nhưng vẫn theo liên kết.
    robots: data && data.total > 0 ? undefined : { index: false, follow: true },
    openGraph: { title, description, url, type: 'website', siteName: 'Tất Tần Tật', locale: 'vi_VN' },
  };
}

const chip: React.CSSProperties = { display: 'inline-block', padding: '7px 14px', borderRadius: 999, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#008247', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' };

export default async function LandingPage({ params }: { params: Params }) {
  const r = resolve((await params).slug);
  if (!r) notFound();
  const { target, area } = r;
  const data = await load(target.slug, area?.label ?? '');
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const where = area ? ` tại ${area.label}` : '';
  const site = siteUrl();
  const browseHref = `/categories?cat=${encodeURIComponent(target.parent.key)}${target.sub ? `&sub=${encodeURIComponent(target.sub.slug)}` : ''}`;
  const crumbs = [
    { name: 'Trang chủ', url: site + '/' },
    { name: target.parent.label, url: site + landingHref(target.parent.slug) },
    ...(target.sub ? [{ name: target.sub.name, url: site + landingHref(target.sub.slug) }] : []),
    ...(area ? [{ name: area.label, url: site + landingHref(target.slug, area.slug) }] : []),
  ];
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) },
    ...(items.length ? [{ '@context': 'https://schema.org', '@type': 'ItemList', name: `Mua bán ${target.name}${where}`, numberOfItems: total, itemListElement: items.slice(0, 24).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, url: `${site}/products/${p.id}` })) }] : []),
  ];
  const siblings = target.sub ? target.parent.subCategories.filter(s => s.slug !== target.sub!.slug) : target.parent.subCategories;

  return (
    <main className="shell" style={{ marginTop: 24, marginBottom: 48 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <nav style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>
        {crumbs.map((c, i) => i < crumbs.length - 1
          ? <span key={c.url}><Link href={c.url.slice(site.length) || '/'} style={{ color: '#475569', textDecoration: 'none' }}>{c.name}</Link> / </span>
          : <span key={c.url} style={{ color: '#00a65a', fontWeight: 600 }}>{c.name}</span>)}
      </nav>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Mua bán {target.name}{where}</h1>
      <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, margin: '0 0 16px', maxWidth: 860 }}>
        {total > 0 ? `${total} tin đăng` : 'Tin đăng'} {target.name.toLowerCase()} cũ và mới{where} trên Tất Tần Tật. Xem giá và hình thật, chat trực tiếp với người bán, hẹn xem hàng gần bạn.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {area && <Link href={landingHref(target.slug)} style={chip}>Toàn quốc</Link>}
        {SEO_AREAS.filter(a => a.slug !== area?.slug).map(a => <Link key={a.slug} href={landingHref(target.slug, a.slug)} style={chip}>{target.name} tại {a.label}</Link>)}
        <Link href={browseHref} style={{ ...chip, background: '#00a65a', color: '#fff', borderColor: '#00a65a' }}>Lọc nâng cao</Link>
      </div>

      {items.length > 0 ? (
        <div className="products-grid-4">
          {items.map(p => <ProductCard key={p.id} product={p} viewMode="GRID_4" />)}
        </div>
      ) : (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
          <p style={{ margin: '0 0 14px' }}>Chưa có tin {target.name.toLowerCase()}{where}. Bạn có món cần bán? Đăng tin miễn phí chỉ trong một phút.</p>
          <Link href="/sell" style={{ ...chip, background: '#00a65a', color: '#fff', borderColor: '#00a65a' }}>Đăng tin miễn phí</Link>
        </div>
      )}
      {total > items.length && (
        <p style={{ textAlign: 'center', marginTop: 20 }}><Link href={browseHref} style={chip}>Xem tất cả {total} tin</Link></p>
      )}

      {siblings.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>{target.sub ? `Danh mục khác trong ${target.parent.label}` : `Danh mục ${target.parent.label}`}{where}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {siblings.map(s => <Link key={s.slug} href={landingHref(s.slug, area?.slug)} style={chip}>{s.name}</Link>)}
          </div>
        </section>
      )}
    </main>
  );
}
