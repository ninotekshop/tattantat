'use client';
import { Star } from 'lucide-react';

/** Hiển thị điểm sao (chỉ đọc), icon Lucide outline. */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return <span role="img" aria-label={`${value} trên 5 sao`} style={{ display: 'inline-flex', gap: 2, verticalAlign: 'middle' }}>
    {[1, 2, 3, 4, 5].map(n => <Star key={n} size={size} strokeWidth={2} aria-hidden="true" color={n <= full ? '#f5a623' : '#cfd6d2'} fill={n <= full ? '#f5a623' : 'none'} />)}
  </span>;
}
/** Chọn số sao. */
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <span role="radiogroup" aria-label="Chọn số sao" style={{ display: 'inline-flex', gap: 4 }}>{[1, 2, 3, 4, 5].map(n =>
    <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'grid', placeItems: 'center' }} aria-label={`${n} sao`}>
      <Star size={28} strokeWidth={2} aria-hidden="true" color={n <= value ? '#f5a623' : '#cfd6d2'} fill={n <= value ? '#f5a623' : 'none'} />
    </button>)}</span>;
}
