'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PartyPopper, PlusCircle, Search } from 'lucide-react';

const COLORS = ['#00a65a', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#14b8a6', '#facc15'];

/** Popup chúc mừng sau khi đăng ký thành công. */
export function WelcomeDialog({ name, onSell, onExplore }: { name?: string; onSell: () => void; onExplore: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onExplore(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onExplore]);
  if (typeof document === 'undefined') return null;
  const first = (name ?? '').trim().split(/\s+/).slice(-1)[0];
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Chào mừng bạn đến với Tất Tần Tật"
      style={{ position: 'fixed', inset: 0, zIndex: 300000, background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflow: 'hidden' }}>
      <style>{`
        @keyframes ttt-pop{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.04);opacity:1}100%{transform:scale(1)}}
        @keyframes ttt-fall{0%{transform:translateY(-12vh) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:.9}}
        @keyframes ttt-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .ttt-confetti{position:fixed;top:0;width:10px;height:16px;border-radius:2px;animation:ttt-fall linear infinite;pointer-events:none}
        @media (prefers-reduced-motion:reduce){.ttt-confetti{display:none}}
      `}</style>
      {Array.from({ length: 36 }, (_, i) => (
        <span key={i} className="ttt-confetti" style={{ left: `${(i * 97) % 100}%`, background: COLORS[i % COLORS.length], animationDuration: `${3.2 + (i % 6) * 0.5}s`, animationDelay: `${(i % 9) * 0.25}s`, transform: `rotate(${i * 25}deg)` }} />
      ))}
      <div style={{ position: 'relative', background: '#fff', borderRadius: 24, width: 'min(460px, 100%)', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,.35)', animation: 'ttt-pop .5s ease-out both', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#00a65a,#14b8a6 60%,#facc15)', padding: '28px 20px 40px' }}>
          <div style={{ width: 76, height: 76, borderRadius: 999, background: 'rgba(255,255,255,.95)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#00a65a', animation: 'ttt-bounce 1.6s ease-in-out infinite', boxShadow: '0 8px 20px rgba(0,0,0,.2)' }}><PartyPopper size={40} /></div>
          <h2 style={{ margin: '14px 0 0', color: '#fff', fontSize: 26, lineHeight: 1.2 }}>Chúc mừng{first ? ` ${first}` : ''}!</h2>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.95)', fontSize: 15, fontWeight: 600 }}>Bạn đã trở thành thành viên của Tất Tần Tật</p>
        </div>
        <div style={{ padding: '22px 24px 24px', marginTop: -18, background: '#fff', borderRadius: '20px 20px 0 0', position: 'relative' }}>
          <p style={{ margin: '0 0 6px', color: '#334155', fontSize: 15.5, lineHeight: 1.6 }}>
            Chúc bạn <b style={{ color: '#00a65a' }}>mua và bán được thật nhiều sản phẩm</b> trên Tất Tần Tật. Hãy mua bán thật uy tín nhé!
          </p>
          <p style={{ margin: '0 0 20px', color: '#0f172a', fontSize: 16, fontWeight: 800 }}>Bạn muốn làm gì tiếp theo ?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button type="button" autoFocus onClick={onSell} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#00a65a', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 10px', justifyContent: 'center', width: '100%', whiteSpace: 'nowrap', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,166,90,.35)' }}><PlusCircle size={18} color="#ffffff" strokeWidth={2.4} style={{ flexShrink: 0, display: 'block' }} /> Đăng tin bán ngay</button>
            <button type="button" onClick={onExplore} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#00a65a', border: '2px solid #00a65a', borderRadius: 12, padding: '10px 10px', justifyContent: 'center', width: '100%', whiteSpace: 'nowrap', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}><Search size={18} style={{ flexShrink: 0 }} /> Tìm sản phẩm</button>
          </div>
        </div>
      </div>
    </div>, document.body);
}
