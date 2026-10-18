import type { Metadata } from 'next';
import { MarketplaceHome } from '../components/MarketplaceHome';

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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === 'string' ? params[key] : '';
  return <MarketplaceHome query={value('q')} group={value('category')} sort={value('sort')} view={value('view')} />;
}
