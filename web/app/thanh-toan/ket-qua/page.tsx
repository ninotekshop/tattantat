'use client';
import '../../checkout/[id]/checkout.css';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, Loader2, PartyPopper, Undo2, ShieldCheck, Heart, Package, Check } from 'lucide-react';
import { memberRequest } from '../../../lib/api';
import { Ic } from '../../../components/Ic';
import { moneyLabel } from '../../../lib/order-ui';

type Info = { orderCode?: string; productName?: string; paymentPlan?: string; depositAmount?: string | null; totalAmount?: string; paymentStatus: string };
const num = (v?: string | null) => String(v ?? '0').replace(/\.\d+$/, '');

function Result() {
  const q = useSearchParams(); const order = q.get('order') ?? ''; const cancelled = q.get('cancel') === '1';
  const [info, setInfo] = useState<Info | null>(null);
  const [status, setStatus] = useState<'CHECKING' | 'PAID' | 'WAITING' | 'CANCELLED'>(cancelled ? 'CANCELLED' : 'CHECKING');
  useEffect(() => {
    if (!order) return; let n = 0; let stop = false;
    const tick = async () => {
      try {
        const r = await memberRequest<Info>(`/payments/order/${order}`); if (!stop) setInfo(r);
        if (!cancelled && r.paymentStatus === 'PAID') { if (!stop) setStatus('PAID'); return; }
      } catch { /* thử lại */ }
      if (cancelled) return;
      if (++n < 15 && !stop) setTimeout(() => void tick(), 2000); else if (!stop) setStatus('WAITING');
    };
    void tick(); return () => { stop = true; };
  }, [order, cancelled]);

  const deposit = info?.paymentPlan === 'DEPOSIT';
  const paid = deposit ? num(info?.depositAmount) : num(info?.totalAmount);
  const rest = deposit ? (BigInt(num(info?.totalAmount)) - BigInt(num(info?.depositAmount))).toString() : null;

  if (status === 'PAID') return <main className="member-page"><div className="co-wrap co-done"><div className="co-confetti" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s`, background: ['#00a65a', '#f5a623', '#2dd4bf', '#fb7185', '#60a5fa'][i % 5] }}/>)}</div>
    <section role="status" aria-live="polite">
      <div className="co-hero">
        <div className="co-badge"><PartyPopper size={34}/></div>
        <h1>{deposit ? 'Đặt cọc thành công, chúc mừng bạn!' : 'Thanh toán thành công, chúc mừng bạn!'}</h1>
        <p>Cảm ơn bạn đã tin tưởng <b>Tất Tần Tật</b>. Chúc bạn sớm nhận được món hàng ưng ý và có trải nghiệm thật tuyệt vời với sản phẩm này.</p>
        {info?.orderCode && <div className="co-code">Mã đơn hàng <b>{info.orderCode}</b></div>}
      </div>
      <div className="co-done-grid">
        <div className="co-card"><h2><Package size={18}/>Thông tin thanh toán</h2>
          {info?.productName && <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{info.productName}</p>}
          <dl className="co-sum">
            <div className="co-row"><dt>Đã thanh toán:</dt><dd>{moneyLabel(paid)}</dd></div>
            <div className="co-row"><dt>Hình thức:</dt><dd style={{ whiteSpace: 'normal' }}>{deposit ? 'Đặt cọc' : 'Thanh toán đủ online'}</dd></div>
            {rest && <div className="co-row"><dt>Còn lại khi nhận hàng:</dt><dd>{moneyLabel(rest)}</dd></div>}
          </dl>
          <p className="co-safe" style={{ marginTop: 14 }}><Ic i={ShieldCheck} size={18} style={{ margin: 0 }}/>Tiền được Tất Tần Tật giữ an toàn và chỉ chuyển cho người bán khi bạn xác nhận đã nhận hàng.</p>
        </div>
        <div className="co-card"><h2><Clock size={18}/>Tiếp theo sẽ như thế nào?</h2>
          <ol className="co-tl">
            <li className="done"><i><Check size={13}/></i><span><b>{deposit ? 'Đã đặt cọc' : 'Đã thanh toán'}</b><small>Người bán đã được báo có đơn đã thanh toán.</small></span></li>
            <li><i>2</i><span><b>Người bán xác nhận và giao hàng</b><small>Bạn sẽ nhận thông báo ở từng bước.</small></span></li>
            <li><i>3</i><span><b>Nhận hàng &amp; xác nhận</b><small>{deposit ? 'Kiểm tra hàng, trả phần còn lại cho người bán rồi bấm “Đã nhận hàng”.' : 'Kiểm tra hàng rồi bấm “Đã nhận hàng” để hoàn tất.'}</small></span></li>
            <li><i>4</i><span><b>Đánh giá trải nghiệm</b><small>Chia sẻ cảm nhận để giúp người mua khác an tâm hơn.</small></span></li>
          </ol>
        </div>
      </div>
      <div className="co-acts"><a className="p" href="/orders">Theo dõi đơn hàng</a><a href="/">Tiếp tục mua sắm</a></div>
      <p className="co-wish"><Heart size={16}/>Chúc bạn mua sắm vui vẻ cùng Tất Tần Tật!</p>
    </section></div></main>;

  const view = {
    CHECKING: { cls: 'gray', icon: <Loader2 size={34}/>, title: 'Đang xác nhận thanh toán…', text: 'Vui lòng chờ trong giây lát, không đóng trang này.' },
    WAITING: { cls: 'warn', icon: <Clock size={34}/>, title: 'Chưa nhận được xác nhận từ ngân hàng', text: 'Nếu bạn đã chuyển tiền, hệ thống sẽ tự cập nhật trong ít phút. Bạn có thể theo dõi trạng thái ở mục Đơn hàng.' },
    CANCELLED: { cls: 'gray', icon: <Undo2 size={34}/>, title: 'Bạn đã hủy thanh toán', text: 'Đơn hàng vẫn còn. Bạn có thể thanh toán lại trong mục Đơn hàng trước khi hết hạn.' },
  }[status];
  return <main className="member-page"><div className="co-wrap co-solo"><section className={'co-hero ' + view.cls} style={{ marginTop: 20 }} role="status">
    <div>
      <div className="co-badge">{view.icon}</div><h1 style={{ fontSize: 22 }}>{view.title}</h1><p>{view.text}</p>
    </div>
    <div className="co-acts" style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18 }}><a className="p" href="/orders" style={{ padding: '12px 20px', borderRadius: 12, fontWeight: 700, background: '#00a65a', color: '#fff', textDecoration: 'none' }}>Về đơn hàng</a></div>
  </section></div></main>;
}
export default function ResultPage() { return <Suspense fallback={null}><Result /></Suspense>; }
