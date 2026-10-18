import type { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';
import { CATEGORY_ENGINE_TAXONOMY } from '../../lib/marketplace';

type SP = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');
const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tattantat.vn').replace(/\/$/, '');

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const p = await searchParams;
  const cat = CATEGORY_ENGINE_TAXONOMY.find(c => c.key === str(p.cat));
  if (!cat) {
    return {
      title: 'Danh mục sản phẩm | Tất Tần Tật',
      description: 'Duyệt tất cả danh mục mua bán trên Tất Tần Tật: nhà đất, xe cộ, đồ điện tử, thời trang, thú cưng, dịch vụ và nhiều hơn nữa.',
      alternates: { canonical: `${site()}/categories?cat=${CATEGORY_ENGINE_TAXONOMY[0].key}` },
    };
  }
  const sub = cat.subCategories.find(s => s.slug === str(p.sub));
  const name = sub ? `${sub.name} - ${cat.label}` : cat.label;
  const hasFilter = Boolean(str(p.sub) || str(p.intent));
  return {
    title: `${name} - Mua bán ${cat.label.toLowerCase()} | Tất Tần Tật`,
    description: `Tin đăng ${sub ? sub.name.toLowerCase() : cat.label.toLowerCase()} mới nhất, giá tốt, gần bạn trên Tất Tần Tật. Mua bán an toàn, đăng tin miễn phí.`,
    alternates: { canonical: `${site()}/categories?cat=${cat.key}` },
    robots: hasFilter ? { index: false, follow: true } : undefined,
  };
}

export default function CategoriesPage() {
  return <CategoriesClient />;
}
