import { formatVnd } from '../lib/marketplace';

/** Giá hiển thị: nếu tin có giá giảm thì giá gốc gạch ngang ở trên, giá giảm nổi bật bên dưới. */
export function hasSale(p: { price?: string | null; salePrice?: string | null; priceMode?: string | null }) {
  const mode = p.priceMode || 'FIXED';
  if (mode === 'CONTACT' || mode === 'FREE' || !p.salePrice || !p.price) return false;
  const a = Number(String(p.price).replace(/\.0+$/, '')), b = Number(String(p.salePrice).replace(/\.0+$/, ''));
  return Number.isFinite(a) && Number.isFinite(b) && b > 0 && b < a;
}

export function OldPrice({ price }: { price: string }) {
  return <span className="price-old">{formatVnd(price)}</span>;
}
