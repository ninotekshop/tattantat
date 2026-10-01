'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { MemberArea } from '../../../components/MemberArea';
import { api, apiGet, ApiError, memberRequest, type Product } from '../../../lib/api';
import { moneyLabel } from '../../../lib/order-ui';
import type { WebSession } from '../../../lib/auth';
import { Check, CheckCircle2, Clock, Wallet, MessageCircle, Package, Store, NotebookPen, Lock, PartyPopper, Heart, Banknote, PiggyBank, CreditCard, ShieldCheck, BadgeCheck, Undo2, TriangleAlert } from 'lucide-react';
import './checkout.css';
import { Ic } from '../../../components/Ic';

type Quote = { subtotal: string; discountAmount: string; shippingFee: string; buyerTotal: string; quoteFingerprint?: string };
type Plan = 'COD' | 'FULL' | 'DEPOSIT';
type Attempt = { key: string; body: { productId: string; quantity: number; note: string; quoteFingerprint: string; paymentPlan: Plan; depositPercent?: number } };
type Options = { online: boolean; depositPercents: number[]; reason: string | null };
const depositOf = (total: string, pct: number) => (BigInt(total) * BigInt(pct) / 100n).toString();
type CreatedOrder = { id: string; orderCode: string; price: Quote };

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  return <MemberArea shell={false}>{session => <Checkout key={id} id={id} session={session}/>}</MemberArea>;
}

function Checkout({ id, session }: { id: string; session: WebSession }) {
  const attempt = useRef<Attempt | null>(null), submitting = useRef(false);
  const [product, setProduct] = useState<Product | null>(null), [quote, setQuote] = useState<Quote | null>(null);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false), [note, setNote] = useState('');
  const [plan, setPlan] = useState<Plan>('COD'), [pct, setPct] = useState(30), [opts, setOpts] = useState<Options>({ online: false, depositPercents: [10, 20, 30, 50], reason: null });
  const [payWarn, setPayWarn] = useState('');
  const [reload, setReload] = useState(0), [changed, setChanged] = useState(false), [uncertain, setUncertain] = useState(false);

  useEffect(() => { memberRequest<Options>('/payments/options').then(setOpts).catch(() => undefined); }, []);
  useEffect(() => { if (!uncertain) attempt.current = null; }, [plan, pct, uncertain]);
  useEffect(() => {
    let active = true;
    setLoading(true); setQuote(null); setAccepted(false); setError('');
    Promise.all([
      api.product(id),
      apiGet<Quote>('/pricing/order-preview?productId=' + encodeURIComponent(id) + '&quantity=1'),
    ]).then(([p, q]) => {
      if (!active) return;
      setProduct(p); setQuote(q); setChanged(false);
      if (!q.quoteFingerprint) setError('Máy chủ cần cập nhật chức năng xác nhận giá trước khi đặt hàng.');
    }).catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, reload]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !accepted || !quote?.quoteFingerprint || changed || product?.sellerId === session.user.id) return;
    submitting.current = true; setBusy(true); setError('');
    attempt.current ??= {
      key: crypto.randomUUID(),
      body: { productId: id, quantity: 1, note: note.trim(), quoteFingerprint: quote.quoteFingerprint, paymentPlan: plan, ...(plan === 'DEPOSIT' ? { depositPercent: pct } : {}) },
    };
    try {
      const result = await memberRequest<CreatedOrder>('/orders', 'POST', attempt.current.body, attempt.current.key);
      setUncertain(false); attempt.current = null;
      if (plan !== 'COD') {
        try {
          const pay = await memberRequest<{ checkoutUrl: string; hasQr?: boolean }>('/payments/online', 'POST', { orderId: result.id });
          window.location.href = pay.hasQr ? `/thanh-toan/qr?order=${result.id}` : pay.checkoutUrl; return;
        } catch (pe) { setPayWarn(pe instanceof Error ? pe.message : 'Chưa tạo được giao dịch thanh toán.'); }
      }
      setOrder(result);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'QUOTE_CHANGED') {
        attempt.current = null; setChanged(true); setAccepted(false); setUncertain(false);
        setError('Giá hoặc phí đã thay đổi. Chưa tạo đơn. Hãy cập nhật báo giá và xác nhận lại.');
      } else if (e instanceof ApiError && [400, 401, 403, 404, 422, 429].includes(e.status)) {
        attempt.current = null; setUncertain(false); setError(e.message);
      } else {
        // A lost response is not evidence that the order failed. Reuse the exact request.
        setUncertain(true);
        setError('Chưa xác nhận được kết quả đặt hàng. Hãy thử lại yêu cầu cũ hoặc kiểm tra danh sách đơn; không đặt thêm từ trang khác.');
      }
    } finally { submitting.current = false; setBusy(false); }
  }

  const steps = (n: number) => <div className="co-steps" aria-label="Các bước đặt hàng">
    {['Chọn sản phẩm', 'Xác nhận đơn', 'Theo dõi đơn hàng'].map((t, k) => <span key={t} style={{ display: 'contents' }}>
      {k > 0 && <span className="co-sep"/>}
      <span className={'co-step' + (k + 1 === n ? ' on' : k + 1 < n ? ' done' : '')}><i>{k + 1 < n ? <Check size={13}/> : k + 1}</i>{t}</span>
    </span>)}
  </div>;

  if (order) {
    const planLabel = plan === 'DEPOSIT' ? `Đặt cọc ${pct}%` : plan === 'FULL' ? 'Thanh toán đủ online' : 'Thanh toán khi nhận hàng (COD)';
    const rest = plan === 'DEPOSIT' ? (BigInt(order.price.buyerTotal) - BigInt(depositOf(order.price.buyerTotal, pct))).toString() : null;
    return <div className="co-wrap">{steps(3)}
      <section className="co-done" role="status" aria-live="polite">
        <div className="co-confetti" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s`, background: ['#00a65a', '#f5a623', '#2dd4bf', '#fb7185', '#60a5fa'][i % 5] }}/>)}</div>
        <div className="co-hero">
          <div className="co-badge"><PartyPopper size={34}/></div>
          <h1>Chúc mừng bạn đã đặt hàng thành công!</h1>
          <p>Cảm ơn bạn đã tin tưởng <b>Tất Tần Tật</b>. Chúc bạn sớm nhận được món hàng ưng ý và có trải nghiệm thật tuyệt vời với sản phẩm này.</p>
          <div className="co-code">Mã đơn hàng <b>{order.orderCode}</b></div>
        </div>
        <div className="co-done-grid">
          <div className="co-card">
            <h2><Package size={18}/>Món hàng của bạn</h2>
            <div className="co-prod">
              {product?.imageUrl ? <img src={product.imageUrl} alt={product.title}/> : <div className="co-noimg"><Package size={28}/></div>}
              <div><b>{product?.title}</b><span><Store size={14}/>Người bán: {product?.sellerName}</span></div>
            </div>
            <dl className="co-sum">
              <div className="co-row"><dt>Tổng đơn hàng:</dt><dd>{moneyLabel(order.price.buyerTotal)}</dd></div>
              <div className="co-row"><dt>Thanh toán:</dt><dd style={{ whiteSpace: 'normal' }}>{planLabel}</dd></div>
              {plan === 'DEPOSIT' && rest && <div className="co-row"><dt>Còn lại khi nhận hàng:</dt><dd>{moneyLabel(rest)}</dd></div>}
            </dl>
          </div>
          <div className="co-card">
            <h2><Clock size={18}/>Tiếp theo sẽ như thế nào?</h2>
            <ol className="co-tl">
              <li className="done"><i><Check size={13}/></i><span><b>Đặt hàng thành công</b><small>Đơn đã được gửi tới người bán.</small></span></li>
              <li><i>2</i><span><b>Người bán xác nhận đơn</b><small>Bạn sẽ nhận thông báo ngay khi người bán xác nhận.</small></span></li>
              <li><i>3</i><span><b>Nhận hàng &amp; thanh toán</b><small>{plan === 'COD' ? 'Kiểm tra hàng rồi thanh toán trực tiếp cho người bán.' : plan === 'DEPOSIT' ? 'Kiểm tra hàng rồi trả phần còn lại cho người bán.' : 'Kiểm tra hàng rồi bấm “Đã nhận hàng” để hoàn tất.'}</small></span></li>
              <li><i>4</i><span><b>Đánh giá trải nghiệm</b><small>Chia sẻ cảm nhận để giúp người mua khác an tâm hơn.</small></span></li>
            </ol>
          </div>
        </div>
        {payWarn && <p className="co-alert"><TriangleAlert size={18}/><span>Đơn đã tạo nhưng chưa thanh toán online: {payWarn} Vào mục Đơn hàng để thanh toán lại.</span></p>}
        {plan !== 'COD' && !payWarn && <p className="co-safe"><Ic i={ShieldCheck} size={18} style={{ margin: 0 }}/>Khoản đã thanh toán được Tất Tần Tật giữ an toàn và chỉ chuyển cho người bán khi bạn nhận hàng.</p>}
        <div className="co-acts"><a className="p" href="/orders">Theo dõi đơn hàng</a><a href={'/messages?product=' + id}>Nhắn người bán</a><a href="/">Tiếp tục mua sắm</a></div>
        <p className="co-wish"><Heart size={16}/>Chúc bạn mua sắm vui vẻ cùng Tất Tần Tật!</p>
      </section>
    </div>;
  }

  const own = product?.sellerId === session.user.id;
  return <div className="co-wrap">
    <div className="co-head"><h1>Xác nhận đặt hàng</h1><p>Kiểm tra lại thông tin trước khi gửi đơn cho người bán.</p></div>
    {steps(2)}
    {error && <p className="co-alert" role="alert"><TriangleAlert size={18}/><span>{error}</span></p>}
    {loading ? <p>Đang tải báo giá từ máy chủ...</p> : product && quote ? <form className="co-grid" onSubmit={submit}>
      <div>
        <section className="co-card"><h2><Package size={18}/>Sản phẩm</h2>
          <div className="co-prod">
            {product.imageUrl ? <img src={product.imageUrl} alt={product.title}/> : <div className="co-noimg"><Package size={28}/></div>}
            <div><b>{product.title}</b><span><Store size={14}/>Người bán: {product.sellerName}</span><span>Số lượng: 1</span></div>
          </div>
        </section>
        <section className="co-card"><h2><Wallet size={18}/>Phương thức thanh toán</h2>
          <div className="co-methods" role="radiogroup" aria-label="Phương thức thanh toán">
            {([
              ['COD', Banknote, 'Thanh toán khi nhận hàng (COD)', 'Không cần trả trước. Trả toàn bộ tiền cho người bán khi nhận hàng.'],
              ['DEPOSIT', PiggyBank, 'Đặt cọc một phần', 'Trả trước một phần online để giữ hàng, phần còn lại trả khi nhận hàng.'],
              ['FULL', CreditCard, 'Thanh toán đủ online', 'Trả toàn bộ online. Tiền được Tất Tần Tật giữ an toàn đến khi bạn xác nhận nhận hàng.'],
            ] as const).map(([k, Icon, title, desc]) => {
              const off = k !== 'COD' && !opts.online;
              return <label key={k} className={'co-method' + (plan === k ? ' on' : '') + (off ? ' off' : '')}>
                <input type="radio" name="plan" value={k} checked={plan === k} disabled={off || busy || uncertain} onChange={() => setPlan(k)}/>
                <Icon size={20}/><span><b>{title}</b><small>{off ? 'Thanh toán online chưa được bật.' : desc}</small></span>
              </label>;
            })}
          </div>
          {plan === 'DEPOSIT' && <div className="co-pct"><span>Mức đặt cọc:</span>
            {opts.depositPercents.map(v => <button type="button" key={v} className={v === pct ? 'on' : ''} disabled={busy || uncertain} onClick={() => setPct(v)}>{v}%</button>)}
            <em>= {moneyLabel(depositOf(quote.buyerTotal, pct))}</em></div>}
          {plan !== 'COD' && <p className="co-note" style={{ marginTop: 10 }}>Nếu đơn bị hủy hoặc người bán không giao hàng, khoản đã thanh toán sẽ được hoàn lại.</p>}
          <a className="co-chat" href={'/messages?product=' + id}><MessageCircle size={16}/>Nhắn người bán để thống nhất giao nhận</a>
        </section>
        <section className="co-card"><h2><NotebookPen size={18}/>Ghi chú cho người bán</h2>
          <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={1000} disabled={busy || uncertain} placeholder="Ví dụ: nhận trực tiếp lúc 18h, vui lòng gọi trước."/>
        </section>
      </div>
      <aside className="co-side"><section className="co-card">
        <h2>Tóm tắt đơn hàng</h2>
        <dl style={{ margin: 0 }}>
          <div className="co-row"><dt>Giá sản phẩm:</dt><dd>{moneyLabel(quote.subtotal)}</dd></div>
          <div className="co-row"><dt>Số lượng:</dt><dd>1</dd></div>
          <div className="co-row disc"><dt>Giảm giá:</dt><dd>{Number(quote.discountAmount) > 0 ? '-' : ''}{moneyLabel(quote.discountAmount)}</dd></div>
          <div className="co-row"><dt>Phí vận chuyển:</dt><dd>{moneyLabel(quote.shippingFee)}</dd></div>
        </dl>
        <div className="co-total"><span>Tổng đơn hàng</span><strong>{moneyLabel(quote.buyerTotal)}</strong></div>
<dl style={{ margin: 0 }}>
        {plan === 'COD' && <div className="co-row"><dt>Trả khi nhận hàng:</dt><dd>{moneyLabel(quote.buyerTotal)}</dd></div>}
        {plan === 'FULL' && <div className="co-row"><dt>Thanh toán ngay:</dt><dd>{moneyLabel(quote.buyerTotal)}</dd></div>}
        {plan === 'DEPOSIT' && <>
          <div className="co-row"><dt>Đặt cọc ngay ({pct}%):</dt><dd>{moneyLabel(depositOf(quote.buyerTotal, pct))}</dd></div>
          <div className="co-row"><dt>Còn lại khi nhận hàng:</dt><dd>{moneyLabel((BigInt(quote.buyerTotal) - BigInt(depositOf(quote.buyerTotal, pct))).toString())}</dd></div></>}
        </dl>
        <p className="co-note">Giá đã được máy chủ xác nhận. Nếu giá thay đổi, hệ thống sẽ báo trước khi tạo đơn.</p>
        <label className="co-agree"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} disabled={busy || changed} required/>
          <span>Tôi đồng ý số tiền trên và đã thống nhất cách giao nhận với người bán.</span></label>
        {own ? <p className="co-alert"><TriangleAlert size={18}/>Bạn không thể mua tin của chính mình.</p>
          : <button className="co-btn" disabled={busy || !accepted || !quote.quoteFingerprint || changed}><Lock size={17}/>{busy ? 'Đang xử lý...' : uncertain ? 'Kiểm tra lại yêu cầu đặt hàng' : plan === 'COD' ? 'Xác nhận đặt hàng COD' : plan === 'DEPOSIT' ? 'Đặt cọc ' + moneyLabel(depositOf(quote.buyerTotal, pct)) : 'Thanh toán ' + moneyLabel(quote.buyerTotal)}</button>}
        {!uncertain && <button type="button" className="co-ghost" disabled={busy} onClick={() => setReload(v => v + 1)}>{changed ? 'Cập nhật báo giá' : 'Tải lại giá'}</button>}
        <ul className="co-trust">
          <li><Ic i={ShieldCheck} size={17} style={{ margin: 0 }}/><span><b>Chưa trả tiền trước.</b> Bạn chỉ thanh toán khi nhận hàng.</span></li>
          <li><Ic i={BadgeCheck} size={17} style={{ margin: 0 }}/><span><b>Giá minh bạch.</b> Hiển thị đầy đủ giảm giá và phí trước khi đặt.</span></li>
          <li><Undo2 size={17}/><span><b>Có thể hủy khi chưa xác nhận.</b> Theo dõi và quản lý ở mục Đơn hàng.</span></li>
        </ul>
        <p className="co-note" style={{ textAlign: 'center', marginTop: 12 }}><a href="/orders" style={{ color: '#00a65a', fontWeight: 600 }}>Kiểm tra các đơn đã tạo</a></p>
      </section></aside>
    </form> : <button className="co-ghost" onClick={() => setReload(v => v + 1)}>Thử tải lại sản phẩm</button>}
  </div>;
}
