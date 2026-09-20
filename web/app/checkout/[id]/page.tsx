'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { MemberArea } from '../../../components/MemberArea';
import { api, apiGet, ApiError, memberRequest, type Product } from '../../../lib/api';
import { moneyLabel } from '../../../lib/order-ui';
import type { WebSession } from '../../../lib/auth';

type Quote = { subtotal: string; discountAmount: string; shippingFee: string; buyerTotal: string; quoteFingerprint?: string };
type Attempt = { key: string; body: { productId: string; quantity: number; note: string; quoteFingerprint: string } };
type CreatedOrder = { id: string; orderCode: string; price: Quote };

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  return <MemberArea>{session => <Checkout key={id} id={id} session={session}/>}</MemberArea>;
}

function Checkout({ id, session }: { id: string; session: WebSession }) {
  const attempt = useRef<Attempt | null>(null), submitting = useRef(false);
  const [product, setProduct] = useState<Product | null>(null), [quote, setQuote] = useState<Quote | null>(null);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false), [note, setNote] = useState('');
  const [reload, setReload] = useState(0), [changed, setChanged] = useState(false), [uncertain, setUncertain] = useState(false);

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
      body: { productId: id, quantity: 1, note: note.trim(), quoteFingerprint: quote.quoteFingerprint },
    };
    try {
      const result = await memberRequest<CreatedOrder>('/orders', 'POST', attempt.current.body, attempt.current.key);
      setOrder(result); setUncertain(false); attempt.current = null;
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

  if (order) return <section className="member-card" role="status">
    <h1>Đặt hàng thành công</h1><h2>{order.orderCode}</h2>
    <p>{product?.title}</p><p className="member-price">{moneyLabel(order.price.buyerTotal)}</p>
    <p>Đơn đang chờ người bán xác nhận. Bạn chưa thanh toán online.</p>
    <div className="member-actions"><a className="member-button member-primary" href="/orders">Theo dõi đơn hàng</a>
      <a className="member-button" href={'/messages?product=' + id}>Nhắn người bán</a></div>
  </section>;

  return <>
    <h1>Xác nhận đặt hàng COD</h1>
    {error && <p role="alert">{error}</p>}
    {loading ? <p>Đang tải báo giá từ máy chủ...</p> : product && quote ? <form className="member-card" onSubmit={submit}>
      {product.imageUrl && <img src={product.imageUrl} alt={product.title} width={160} height={130} style={{ objectFit: 'cover', borderRadius: 12 }}/>}
      <h2>{product.title}</h2><p>Người bán: {product.sellerName}</p>
      <dl><dt>Giá sản phẩm × 1</dt><dd>{moneyLabel(quote.subtotal)}</dd>
        <dt>Giảm giá</dt><dd>{moneyLabel(quote.discountAmount)}</dd>
        <dt>Phí vận chuyển trong đơn</dt><dd>{moneyLabel(quote.shippingFee)}</dd>
        <dt>Tổng thanh toán</dt><dd className="member-price">{moneyLabel(quote.buyerTotal)}</dd></dl>
      <p>COD/giao nhận tự thỏa thuận. Hãy thống nhất nơi nhận và chi phí giao hàng với người bán trước khi đặt. Chưa có vận chuyển tự động hoặc thanh toán online.</p>
      <p><a href={'/messages?product=' + id}>Nhắn người bán để thống nhất giao nhận</a></p>
      <label>Ghi chú cho người bán<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={1000} disabled={busy || uncertain} placeholder="Ví dụ: nhận trực tiếp lúc 18h, vui lòng gọi trước."/></label>
      <label><input style={{ width: 'auto', display: 'inline' }} type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} disabled={busy || changed} required/> Tôi đồng ý số tiền trên và đã thống nhất cách giao nhận với người bán.</label>
      {product.sellerId === session.user.id ? <p>Bạn không thể mua tin của chính mình.</p> : <button className="member-primary" disabled={busy || !accepted || !quote.quoteFingerprint || changed}>{busy ? 'Đang xác nhận...' : uncertain ? 'Kiểm tra lại yêu cầu đặt hàng' : 'Xác nhận đặt hàng COD'}</button>}
      {!uncertain && <button type="button" disabled={busy} onClick={() => setReload(v => v + 1)}>{changed ? 'Cập nhật báo giá' : 'Tải lại giá'}</button>}
      <p><a href="/orders">Kiểm tra các đơn đã tạo</a></p>
    </form> : <button onClick={() => setReload(v => v + 1)}>Thử tải lại sản phẩm</button>}
  </>;
}
