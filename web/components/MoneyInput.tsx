'use client';

import type { InputHTMLAttributes } from 'react';

/** Định dạng số tiền có dấu chấm phân cách hàng nghìn: 1500000 → 1.500.000 */
export function formatMoney(value: string | number | null | undefined) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: string | number | null | undefined;
  /** Trả về chuỗi chỉ gồm chữ số ('' khi để trống). */
  onChange: (digits: string) => void;
};

/** Ô nhập tiền: hiển thị dấu chấm hàng nghìn khi gõ, giá trị trả ra là chuỗi số thuần. */
export function MoneyInput({ value, onChange, maxLength = 17, ...rest }: Props) {
  return <input {...rest} type="text" inputMode="numeric" autoComplete="off" maxLength={maxLength}
    value={formatMoney(value)} onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 13))} />;
}
