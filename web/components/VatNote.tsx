import { vndNeededForCoin } from '../lib/coin';
import { vnd } from '../lib/billing';

/** Số tiền khách chuyển khoản thực tế = giá gói + VAT 8% (làm tròn 1.000đ), VD: 499.000 + VAT 8% = 539.000đ. */
export function vatBreakdown(price: string | number) {
  const net = Math.ceil(Number(price) || 0);
  if (net <= 0) return null;
  const total = vndNeededForCoin(net);
  return { net, vat: total - net, total };
}

export function VatNote({ price }: { price: string | number }) {
  const b = vatBreakdown(price);
  if (!b) return null;
  return <div className="bl-vat">+ VAT 8% ({vnd(b.vat)}) = <b>{vnd(b.total)}</b></div>;
}
