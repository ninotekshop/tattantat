import { Text, View, type TextStyle } from 'react-native';
import { C } from '@/lib/theme';
import { vnd } from '@/lib/format';

/** Có giá giảm hợp lệ (nhỏ hơn giá gốc) và tin có giá bán cố định. */
export function hasSale(price?: string | number | null, salePrice?: string | number | null, mode?: string | null) {
  if (mode === 'CONTACT' || mode === 'FREE') return false;
  const a = Number(price ?? 0), b = Number(salePrice ?? 0);
  return Number.isFinite(a) && Number.isFinite(b) && b > 0 && b < a;
}

/** Giá hiển thị: giá gốc gạch ngang ở trên, giá giảm nổi bật bên dưới. */
export function PriceView({ price, salePrice, mode, style, oldSize }: { price?: string | number | null; salePrice?: string | number | null; mode?: string | null; style: TextStyle | TextStyle[]; oldSize?: number }) {
  if (!hasSale(price, salePrice, mode)) return <Text style={style}>{vnd(price, mode)}</Text>;
  return (
    <View>
      <Text style={{ color: C.muted, fontSize: oldSize ?? 12, textDecorationLine: 'line-through' }}>{vnd(price, mode)}</Text>
      <Text style={style}>{vnd(salePrice, mode)}</Text>
    </View>
  );
}
