import type { Metadata } from 'next';
import { MarketplaceHome } from '../components/MarketplaceHome';
import { getBaseUrl, type Product } from '../lib/api';
import Link from 'next/link';
import { CATEGORY_ENGINE_TAXONOMY } from '../lib/marketplace';
import { landingHref } from '../lib/seo-landing';

const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tattantat.vn').replace(/\/$/, '');

/** Trang chủ: title và mô tả riêng. Các biến thể ?q= ?sort= ?category= ?view= canonical về trang chủ và không lập chỉ mục để tránh trùng nội dung. */
export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const p = await searchParams;
  const has = ['q', 'sort', 'category', 'view'].some(k => typeof p[k] === 'string' && p[k]);
  return {
    title: 'Tất Tần Tật - Chợ mua bán đồ cũ và mới, đăng tin miễn phí gần bạn',
    description: 'Mua bán mọi thứ gần bạn: nhà đất, xe cộ, đồ điện tử, thời trang, thú cưng, dịch vụ. Đăng tin miễn phí, chat trực tiếp với người bán, giao dịch an toàn.',
    alternates: { canonical: site() + '/' },
    robots: has ? { index: false, follow: true } : undefined,
  };
}

// Tải sẵn trang tin đầu tiên trên máy chủ để tin đăng nằm ngay trong HTML (Google, Facebook, Zalo đọc được).
// Lỗi hoặc quá 3 giây thì trả null - trình duyệt sẽ tự tải như trước.
async function loadInitial(q: string): Promise<{ items: Product[]; total: number } | null> {
  const bases = [process.env.API_INTERNAL_BASE_URL, getBaseUrl(), `${site()}/api/v1`]
    .map(b => (b ?? '').replace(/\/$/, ''))
    .filter((b, i, a) => /^https?:\/\//i.test(b) && a.indexOf(b) === i);
  const qs = new URLSearchParams({ sort: 'new', limit: '24' });
  if (q) qs.set('q', q);
  for (const base of bases) {
    try {
      const res = await fetch(`${base}/search/products?${qs}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(3000) });
      if (!res.ok) continue;
      const j = await res.json() as { success?: boolean; data?: { items?: Product[]; total?: number } };
      if (j?.success && Array.isArray(j.data?.items)) return { items: j.data.items, total: j.data.total ?? j.data.items.length };
    } catch { /* thử địa chỉ tiếp theo */ }
  }
  return null;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === 'string' ? params[key] : '';
  const filtered = ['q', 'sort', 'category', 'view'].some(k => value(k));
  return (
    <>
      <MarketplaceHome query={value('q')} group={value('category')} sort={value('sort')} view={value('view')} initial={await loadInitial(value('q'))} />
      {/* Liên kết tới các trang danh mục theo khu vực - giúp Google tìm thấy và người dùng vào nhanh. */}
      {!filtered && (
        <section className="shell" style={{ margin: '8px auto 40px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>Mua bán tại Quy Nhơn</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORY_ENGINE_TAXONOMY.map(c => (
              <Link key={c.key} href={landingHref(c.slug, 'quy-nhon')} style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#008247', fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>{c.label} Quy Nhơn</Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
