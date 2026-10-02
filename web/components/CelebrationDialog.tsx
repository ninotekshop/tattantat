'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { BadgeCheck, PackageCheck, PartyPopper, Rocket, ShoppingBag, Wallet } from 'lucide-react';

export type CelebrationKind = 'buy' | 'sell' | 'topup' | 'plan' | 'promo';

const COLORS = ['#00a65a', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#14b8a6', '#facc15'];
type Cfg = { icon: typeof PartyPopper; grad: string; title: string; sub: string; message: string; primary: [string, string]; secondary: [string, string | null] };
const CFG: Record<CelebrationKind, Cfg> = {
  buy: { icon: ShoppingBag, grad: 'linear-gradient(135deg,#00a65a,#14b8a6 60%,#facc15)', title: 'Giao dịch mua hoàn tất!', sub: 'Cảm ơn bạn đã mua sắm trên Tất Tần Tật',
    message: 'Chúc bạn thật hài lòng với món hàng mới và có những trải nghiệm tuyệt vời. Một lời đánh giá của bạn sẽ giúp người bán thêm uy tín và cộng đồng mua sắm an tâm hơn.', primary: ['Tiếp tục mua sắm', '/'], secondary: ['Xem đơn hàng', null] },
  sell: { icon: PackageCheck, grad: 'linear-gradient(135deg,#f59e0b,#ef4444 70%,#a855f7)', title: 'Chúc mừng bạn đã bán thành công!', sub: 'Cảm ơn bạn là người bán uy tín của Tất Tần Tật',
    message: 'Mỗi giao dịch thành công là một bước tiến cho cửa hàng của bạn. Chúc bạn ngày càng đắt khách, chốt đơn thật nhanh và doanh thu thật nhiều!', primary: ['Đăng thêm tin bán', '/sell'], secondary: ['Xem đơn hàng', null] },
  topup: { icon: Wallet, grad: 'linear-gradient(135deg,#0ea5e9,#00a65a 70%,#facc15)', title: 'Nạp ví thành công!', sub: 'Cảm ơn bạn đã tin tưởng Tất Tần Tật',
    message: 'Số dư đã sẵn sàng để bạn mua gói đăng tin, đẩy tin nổi bật. Chúc bạn bán hàng thật nhanh, thật nhiều!', primary: ['Mua gói ngay', '/goi-dich-vu'], secondary: ['Đóng', null] },
  plan: { icon: BadgeCheck, grad: 'linear-gradient(135deg,#7c3aed,#3b82f6 60%,#14b8a6)', title: 'Kích hoạt gói thành công!', sub: 'Cảm ơn bạn đã đồng hành cùng Tất Tần Tật',
    message: 'Giờ bạn có thể đăng tin thoải mái hơn, tiếp cận nhiều khách hàng hơn. Chúc bạn bán đắt hàng và gặt hái thật nhiều thành công!', primary: ['Đăng tin ngay', '/sell'], secondary: ['Xem ví & gói', null] },
  promo: { icon: Rocket, grad: 'linear-gradient(135deg,#ef4444,#f59e0b 60%,#facc15)', title: 'Đẩy tin thành công!', sub: 'Tin của bạn sắp được nhiều người nhìn thấy hơn',
    message: 'Cảm ơn bạn đã sử dụng dịch vụ của Tất Tần Tật. Chúc tin đăng của bạn thu hút thật nhiều người mua và chốt đơn thật nhanh!', primary: ['Đăng thêm tin', '/sell'], secondary: ['Đóng', null] },
};

/** Popup chúc mừng sau khi hoàn thành giao dịch mua, bán, nạp ví, mua gói. */
export function CelebrationDialog({ kind, amount, onClose }: { kind: CelebrationKind; amount?: string; onClose: () => void }) {
  const router = useRouter();
  const c = CFG[kind]; const Icon = c.icon;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={c.title} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 300000, background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflow: 'hidden' }}>
      <style>{`
        @keyframes ttt-pop{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.04);opacity:1}100%{transform:scale(1)}}
        @keyframes ttt-fall{0%{transform:translateY(-12vh) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:.9}}
        @keyframes ttt-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .ttt-confetti{position:fixed;top:0;width:10px;height:16px;border-radius:2px;animation:ttt-fall linear infinite;pointer-events:none}
        @media (prefers-reduced-motion:reduce){.ttt-confetti{display:none}}
      `}</style>
      {Array.from({ length: 36 }, (_, i) => (
        <span key={i} className="ttt-confetti" style={{ left: `${(i * 97) % 100}%`, background: COLORS[i % COLORS.length], animationDuration: `${3.2 + (i % 6) * 0.5}s`, animationDelay: `${(i % 9) * 0.25}s` }} />
      ))}
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: '#fff', borderRadius: 24, width: 'min(460px, 100%)', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,.35)', animation: 'ttt-pop .5s ease-out both', overflow: 'hidden' }}>
        <div style={{ background: c.grad, padding: '28px 20px 40px' }}>
          <div style={{ width: 76, height: 76, borderRadius: 999, background: 'rgba(255,255,255,.95)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#00a65a', animation: 'ttt-bounce 1.6s ease-in-out infinite', boxShadow: '0 8px 20px rgba(0,0,0,.2)' }}><Icon size={40} /></div>
          <h2 style={{ margin: '14px 0 0', color: '#fff', fontSize: 25, lineHeight: 1.2 }}>{c.title}</h2>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.95)', fontSize: 15, fontWeight: 600 }}>{c.sub}</p>
        </div>
        <div style={{ padding: '22px 24px 24px', marginTop: -18, background: '#fff', borderRadius: '20px 20px 0 0', position: 'relative' }}>
          {amount && <div style={{ fontSize: 30, fontWeight: 900, color: '#00a65a', marginBottom: 6 }}>{amount}</div>}
          <p style={{ margin: '0 0 20px', color: '#334155', fontSize: 15.5, lineHeight: 1.6 }}>{c.message}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button" autoFocus onClick={() => { onClose(); router.push(c.primary[1]); }} style={{ background: '#00a65a', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,166,90,.35)' }}>{c.primary[0]}</button>
            <button type="button" onClick={() => { onClose(); if (c.secondary[1]) router.push(c.secondary[1]); }} style={{ background: '#fff', color: '#00a65a', border: '2px solid #00a65a', borderRadius: 12, padding: '10px 20px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{c.secondary[0]}</button>
          </div>
        </div>
      </div>
    </div>, document.body);
}
