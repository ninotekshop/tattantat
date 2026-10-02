'use client';

import { useEffect, useRef, useState } from 'react';

// Các mốc giá (đ). Thanh kéo chạy theo mốc để dễ chọn cả khoảng vài trăm nghìn lẫn hàng chục tỷ.
const STOPS = [0, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 7_000_000, 10_000_000, 15_000_000, 20_000_000, 30_000_000, 50_000_000, 70_000_000, 100_000_000, 150_000_000, 200_000_000, 300_000_000, 500_000_000, 700_000_000, 1_000_000_000, 2_000_000_000, 3_000_000_000, 5_000_000_000, 7_000_000_000, 10_000_000_000, 20_000_000_000, 50_000_000_000];
const LAST = STOPS.length - 1;

function short(v: number) {
  if (v >= 1_000_000_000) return `${+(v / 1_000_000_000).toFixed(1)} tỷ`;
  if (v >= 1_000_000) return `${+(v / 1_000_000).toFixed(1)} triệu`;
  if (v >= 1_000) return `${Math.round(v / 1_000)} nghìn`;
  return `${v}đ`;
}

function nearest(raw: string, fallback: number) {
  const n = Number(String(raw).replace(/\D/g, ''));
  if (!raw || !Number.isFinite(n)) return fallback;
  let best = 0;
  for (let i = 0; i < STOPS.length; i++) if (Math.abs(STOPS[i] - n) < Math.abs(STOPS[best] - n)) best = i;
  return best;
}

interface Props {
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
}

/** Thước kéo hai đầu chọn khoảng giá. Chỉ gửi giá trị lọc sau khi người dùng dừng kéo (tránh gọi tìm kiếm liên tục). */
export function PriceRangeSlider({ min, max, onChange }: Props) {
  const [lo, setLo] = useState(() => nearest(min, 0));
  const [hi, setHi] = useState(() => nearest(max, LAST));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef({ min, max });

  // Đồng bộ khi bộ lọc bị đổi từ bên ngoài (ví dụ xóa lọc).
  useEffect(() => {
    if (min === last.current.min && max === last.current.max) return;
    last.current = { min, max };
    setLo(nearest(min, 0));
    setHi(nearest(max, LAST));
  }, [min, max]);

  function commit(nextLo: number, nextHi: number) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const nMin = nextLo <= 0 ? '' : String(STOPS[nextLo]);
      const nMax = nextHi >= LAST ? '' : String(STOPS[nextHi]);
      last.current = { min: nMin, max: nMax };
      onChange(nMin, nMax);
    }, 350);
  }

  const label = lo === 0 && hi === LAST ? 'Mọi mức giá'
    : lo === 0 ? `Dưới ${short(STOPS[hi])}`
    : hi === LAST ? `Từ ${short(STOPS[lo])} trở lên`
    : `${short(STOPS[lo])} – ${short(STOPS[hi])}`;
  const pct = (i: number) => (i / LAST) * 100;

  return (
    <div className="prs" style={{ minWidth: 260, flex: '1 1 260px', maxWidth: 380 }}>
      <style>{`
        .prs-track{position:relative;height:28px}
        .prs-rail,.prs-fill{position:absolute;top:12px;height:4px;border-radius:2px}
        .prs-rail{left:0;right:0;background:#dbe4dd}
        .prs-fill{background:#00a65a}
        .prs input[type=range]{position:absolute;left:0;top:0;width:100%;height:28px;margin:0;background:none;pointer-events:none;-webkit-appearance:none;appearance:none}
        .prs input[type=range]::-webkit-slider-runnable-track{background:transparent;height:28px}
        .prs input[type=range]::-moz-range-track{background:transparent;height:28px}
        .prs input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;pointer-events:auto;width:22px;height:22px;margin-top:3px;border-radius:50%;background:#fff;border:3px solid #00a65a;box-shadow:0 1px 4px rgba(0,0,0,.25);cursor:grab}
        .prs input[type=range]::-moz-range-thumb{pointer-events:auto;width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid #00a65a;box-shadow:0 1px 4px rgba(0,0,0,.25);cursor:grab}
        .prs input[type=range]:focus-visible::-webkit-slider-thumb{outline:2px solid #0f766e;outline-offset:2px}
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{ fontSize: 12.5, color: '#64748b' }}>Khoảng giá</span>
        <strong style={{ fontSize: 13.5, color: '#0f172a' }}>{label}</strong>
      </div>
      <div className="prs-track">
        <div className="prs-rail" />
        <div className="prs-fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range" min={0} max={LAST} step={1} value={lo}
          aria-label="Giá từ" aria-valuetext={lo === 0 ? 'Không giới hạn dưới' : short(STOPS[lo])}
          onChange={e => { const v = Math.min(Number(e.target.value), hi - 1 < 0 ? 0 : hi); setLo(v); commit(v, hi); }}
          style={{ zIndex: lo >= LAST - 1 ? 5 : 3 }}
        />
        <input
          type="range" min={0} max={LAST} step={1} value={hi}
          aria-label="Giá đến" aria-valuetext={hi === LAST ? 'Không giới hạn trên' : short(STOPS[hi])}
          onChange={e => { const v = Math.max(Number(e.target.value), lo); setHi(v); commit(lo, v); }}
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}
