'use client';
import { Ic } from '../../components/Ic';
import { ChevronDown, ChevronLeft, ChevronRight, Search, ShieldCheck, Wallet } from 'lucide-react';
import './orders.css';
import { useEffect, useMemo, useState } from 'react';
import { MemberArea } from '../../components/MemberArea';
import { memberRequest } from '../../lib/api';
import { moneyLabel, orderActions, orderLabels } from '../../lib/order-ui';
import type { WebSession } from '../../lib/auth';
import { ReviewPanel } from '../../components/reviews/ReviewPanel';
import { DisputePanel } from '../../components/orders/DisputePanel';
import { CelebrationDialog, type CelebrationKind } from '../../components/CelebrationDialog';
type Order = { id: string; order_code: string; buyer_id: string; seller_id: string; order_status: string; total_amount: string; payment_status: string; payment_method: string; payment_plan?: string; deposit_percent?: number | null; deposit_amount?: string | null; note: string | null; review_id?: string | null; product_name?: string | null; quantity?: number; buyer_name?: string; seller_name?: string; created_at: string; completed_at?: string | null; updated_at?: string | null };
type Price = { subtotal: string; discount: string; shippingFee: string; paymentFee: string; buyerTotal: string; platformFee: string; sellerPayout: string };
export default function OrdersPage() { return <MemberArea>{session => <Orders session={session}/>}</MemberArea>; }
function Orders({ session }: { session: WebSession }) {
  const [celebrate, setCelebrate] = useState<CelebrationKind | null>(null);
  const [orders, setOrders] = useState<Order[]>([]), [prices, setPrices] = useState<Record<string, Price>>({});
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(''), [error, setError] = useState(''), [reload, setReload] = useState(0);
  const [filter, setFilter] = useState('all'), [statusGroup, setStatusGroup] = useState('all'), [q, setQ] = useState(''), [sort, setSort] = useState('new'), [page, setPage] = useState(1), [openId, setOpenId] = useState<string | null>(null), [disputeOpen, setDisputeOpen] = useState<string | null>(null), [reviewOpen, setReviewOpen] = useState<string | null>(null);
  useEffect(() => { let active = true; setLoading(true); memberRequest<Order[]>('/orders').then(items => { if (active) { setOrders(items); setError(''); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [reload]);
  async function transition(order: Order, status: string) {
    const text = status === 'COMPLETED' ? 'Xác nhận đã giao hàng và đã thu đủ tiền COD? Thao tác này ghi nhận doanh thu và khoản phải trả người bán.' : status === 'CANCELLED' ? 'Hủy đơn ' + order.order_code + '? Sản phẩm sẽ được mở bán lại' + (order.payment_status === 'PAID' ? ' và khoản đã thanh toán sẽ được hoàn lại.' : '.') : 'Chuyển đơn ' + order.order_code + ' sang “' + orderLabels[status] + '”?';
    if (busy || !window.confirm(text)) return; setBusy(order.id); setError('');
    try { await memberRequest('/orders/' + order.id + (status === 'COMPLETED' ? '/complete' : '/status'), 'POST', status === 'COMPLETED' ? {} : { status }); setReload(v => v + 1); if (status === 'COMPLETED') setCelebrate('sell'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể cập nhật đơn. Hãy tải lại trước khi thử lại.'); } finally { setBusy(''); }
  }
  async function payOnline(order: Order) {
    if (busy) return; setBusy(order.id); setError('');
    try { const r = await memberRequest<{ checkoutUrl: string; hasQr?: boolean }>('/payments/online', 'POST', { orderId: order.id }); window.location.href = r.hasQr ? `/thanh-toan/qr?order=${order.id}` : r.checkoutUrl; return; }
    catch (e) { setError(e instanceof Error ? e.message : 'Không tạo được thanh toán.'); } setBusy('');
  }
  async function confirmReceipt(order: Order) {
    if (busy || !window.confirm('Xác nhận bạn đã nhận đúng hàng? Tiền sẽ được chuyển cho người bán và bạn không thể hoàn tác.')) return; setBusy(order.id); setError('');
    try { await memberRequest('/orders/' + order.id + '/confirm-receipt', 'POST', {}); setReload(v => v + 1); setCelebrate('buy'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể xác nhận.'); } finally { setBusy(''); }
  }
  async function price(order: Order) { setBusy(order.id); setError(''); try { const value = await memberRequest<Price>('/orders/' + order.id + '/price'); setPrices(old => ({ ...old, [order.id]: value })); } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải giá.'); } finally { setBusy(''); } }
  const PAGE = 15;
  const mine = (o: Order) => o.seller_id === session.user.id;
  const GROUPS: { key: string; label: string; test: (o: Order) => boolean }[] = [
    { key: 'all', label: 'Tất cả', test: () => true },
    { key: 'open', label: 'Đang xử lý', test: o => ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'].includes(o.order_status) },
    { key: 'done', label: 'Hoàn tất', test: o => o.order_status === 'COMPLETED' },
    { key: 'cancel', label: 'Đã hủy / hoàn tiền', test: o => ['CANCELLED', 'REFUNDED'].includes(o.order_status) },
    { key: 'dispute', label: 'Khiếu nại', test: o => o.order_status === 'DISPUTED' },
  ];
  const byRole = useMemo(() => orders.filter(o => filter === 'all' || (filter === 'buy' ? !mine(o) : mine(o))), [orders, filter]); // eslint-disable-line react-hooks/exhaustive-deps
  const kw = q.trim().toLowerCase();
  const searched = useMemo(() => byRole.filter(o => !kw || [o.order_code, o.product_name, o.buyer_name, o.seller_name].some(v => (v ?? '').toLowerCase().includes(kw))), [byRole, kw]);
  const counts = Object.fromEntries(GROUPS.map(g => [g.key, searched.filter(g.test).length])) as Record<string, number>;
  const list = useMemo(() => {
    const g = GROUPS.find(x => x.key === statusGroup) ?? GROUPS[0];
    const rows = searched.filter(g.test);
    const val = (o: Order) => Number(String(o.total_amount).replace(/\.\d+$/, '')) || 0;
    return [...rows].sort((a, b) => sort === 'old' ? +new Date(a.created_at) - +new Date(b.created_at) : sort === 'high' ? val(b) - val(a) : sort === 'low' ? val(a) - val(b) : +new Date(b.created_at) - +new Date(a.created_at));
  }, [searched, statusGroup, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(page, pages);
  const rows = list.slice((cur - 1) * PAGE, cur * PAGE);
  const roleCount = { all: orders.length, buy: orders.filter(o => !mine(o)).length, sell: orders.filter(mine).length };
  const payLabel = (o: Order) => o.payment_plan === 'DEPOSIT' ? `Cọc ${o.deposit_percent}%` : o.payment_plan === 'FULL' ? 'Trả đủ online' : o.payment_method === 'COD' ? 'COD' : 'Online';
  const paidLabel = (o: Order) => ({ PAID: 'Đã thanh toán', PROCESSING: 'Đang hoàn tiền', REFUNDED: 'Đã hoàn tiền' } as Record<string, string>)[o.payment_status] ?? 'Chưa thanh toán';
  /** Nút hành động chính hiện ngay trên dòng; các thao tác khác nằm trong phần chi tiết. */
  function primary(o: Order): { label: string; run: () => void } | null {
    if (!mine(o) && o.order_status === 'PENDING' && o.payment_status !== 'PAID' && o.payment_plan && o.payment_plan !== 'COD') return { label: o.payment_plan === 'DEPOSIT' ? 'Đặt cọc' : 'Thanh toán', run: () => void payOnline(o) };
    if (!mine(o) && o.payment_method !== 'COD' && o.payment_status === 'PAID' && ['SHIPPING', 'DELIVERED'].includes(o.order_status)) return { label: 'Đã nhận hàng', run: () => void confirmReceipt(o) };
    const next = orderActions(o, session.user.id).find(a => a !== 'CANCELLED');
    if (next) return { label: next === 'COMPLETED' ? 'Đã thu COD' : orderLabels[next], run: () => void transition(o, next) };
    if (o.order_status === 'COMPLETED' && !mine(o) && !o.review_id) return { label: 'Đánh giá', run: () => { setOpenId(o.id); setReviewOpen(o.id); } };
    return null;
  }
  const reset = () => setPage(1);

  return <div className="od-page">
    {celebrate && <CelebrationDialog kind={celebrate} onClose={() => setCelebrate(null)} />}
    <div className="od-head"><h1>Đơn hàng</h1><button className="od-btn" disabled={!!busy} onClick={() => setReload(v => v + 1)}>Tải lại</button></div>
    <div className="od-roles" role="tablist">{([['all', 'Tất cả'], ['buy', 'Tôi mua'], ['sell', 'Tôi bán']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={filter === k} className={'od-role' + (filter === k ? ' on' : '')} onClick={() => { setFilter(k); reset(); }}>{l}<em>{roleCount[k]}</em></button>)}</div>
    <div className="od-tools">
      <label className="od-search"><Search size={16} /><input value={q} onChange={e => { setQ(e.target.value); reset(); }} placeholder="Tìm mã đơn, sản phẩm, tên người mua/bán…" /></label>
      <select className="od-sort" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sắp xếp"><option value="new">Mới nhất</option><option value="old">Cũ nhất</option><option value="high">Giá cao → thấp</option><option value="low">Giá thấp → cao</option></select>
    </div>
    <div className="od-chips">{GROUPS.map(g => <button key={g.key} className={'od-chip' + (statusGroup === g.key ? ' on' : '')} onClick={() => { setStatusGroup(g.key); reset(); }}>{g.label}<em>{counts[g.key]}</em></button>)}</div>
    {error && <p className="od-err" role="alert">{error}</p>}
    {loading ? <div className="od-skel">{[0, 1, 2, 3, 4].map(i => <i key={i} />)}</div> : !rows.length ? <div className="od-empty"><h3>{orders.length ? 'Không có đơn nào khớp bộ lọc' : 'Chưa có đơn hàng'}</h3><p>{orders.length ? 'Thử đổi từ khóa hoặc bộ lọc trạng thái.' : 'Khi bạn mua hoặc bán hàng, đơn sẽ hiện ở đây.'}</p></div> :
    <div className="od-list">
      <div className="od-th"><span>Đơn hàng</span><span>Đối tác</span><span>Trạng thái</span><span>Thanh toán</span><span className="r">Tổng tiền</span><span /></div>
      {rows.map(o => { const open = openId === o.id; const pr = primary(o); const who = mine(o) ? o.buyer_name : o.seller_name;
        return <article key={o.id} className={'od-row ord-' + o.order_status + (open ? ' open' : '')}>
          <div className="od-line" onClick={() => setOpenId(open ? null : o.id)}>
            <div className="od-main"><b className="od-code">{o.order_code}</b><span className="od-prod">{o.product_name || 'Sản phẩm'}{(o.quantity ?? 1) > 1 ? ` × ${o.quantity}` : ''}</span><time>{new Date(o.created_at).toLocaleDateString('vi-VN')}</time></div>
            <div className="od-who"><span className="ord-kind">{mine(o) ? 'Đơn bán' : 'Đơn mua'}</span><span className="od-name">{who || '—'}</span></div>
            <div><span className={'ord-st st-' + o.order_status}>{orderLabels[o.order_status] || o.order_status}</span></div>
            <div className="od-pay"><b>{payLabel(o)}</b><span>{paidLabel(o)}</span></div>
            <div className="od-total">{moneyLabel(o.total_amount)}</div>
            <div className="od-act">{pr && <button className="od-btn primary" disabled={!!busy} onClick={e => { e.stopPropagation(); pr.run(); }}>{pr.label}</button>}
              <button className="od-toggle" aria-expanded={open} aria-label={open ? 'Thu gọn' : 'Xem chi tiết'}><ChevronDown size={18} /></button></div>
          </div>
          {open && <div className="od-detail">
            <div className="od-facts">
              <div><span>Ngày đặt</span><b>{new Date(o.created_at).toLocaleString('vi-VN')}</b></div>
              <div><span>Hình thức</span><b>{payLabel(o)} · {paidLabel(o)}</b></div>
              {o.payment_plan === 'DEPOSIT' && o.deposit_amount && <div><span>Đặt cọc</span><b>{moneyLabel(o.deposit_amount)} · còn lại {moneyLabel((BigInt(o.total_amount.replace(/\.0+$/, '')) - BigInt(o.deposit_amount.replace(/\.0+$/, ''))).toString())} trả khi nhận hàng</b></div>}
              {o.note && <div className="wide"><span>Ghi chú</span><b style={{ whiteSpace: 'pre-wrap' }}>{o.note}</b></div>}
            </div>
            {o.payment_method !== 'COD' && o.payment_status === 'PAID' && !['COMPLETED', 'CANCELLED'].includes(o.order_status) && <p className="od-safe"><Ic i={ShieldCheck} />Tất Tần Tật đang giữ tiền và chỉ chuyển cho người bán khi người mua xác nhận nhận hàng.</p>}
            <div className="od-actions">
              {!mine(o) && o.order_status === 'PENDING' && o.payment_status !== 'PAID' && o.payment_plan && o.payment_plan !== 'COD' && <button className="od-btn primary" disabled={!!busy} onClick={() => payOnline(o)}>{o.payment_plan === 'DEPOSIT' ? 'Đặt cọc ' + moneyLabel(o.deposit_amount ?? '0') : 'Thanh toán online (được bảo vệ)'}</button>}
              {!mine(o) && o.payment_method !== 'COD' && o.payment_status === 'PAID' && ['SHIPPING', 'DELIVERED'].includes(o.order_status) && <button className="od-btn primary" disabled={!!busy} onClick={() => confirmReceipt(o)}>Đã nhận hàng</button>}
              <button className="od-btn" disabled={!!busy} onClick={() => price(o)}>Chi tiết giá đã chốt</button>
              {orderActions(o, session.user.id).map(status => <button key={status} className={'od-btn' + (status === 'CANCELLED' ? ' danger' : '')} disabled={!!busy} onClick={() => transition(o, status)}>{status === 'COMPLETED' ? 'Xác nhận đã thu COD' : status === 'CANCELLED' ? 'Hủy đơn' : orderLabels[status]}</button>)}
              {o.order_status === 'COMPLETED' && <button className="od-btn" disabled={!!busy} onClick={() => setReviewOpen(reviewOpen === o.id ? null : o.id)}>Đánh giá</button>}
              {['SHIPPING', 'DELIVERED', 'COMPLETED', 'DISPUTED'].includes(o.order_status) && <button className="od-btn" disabled={!!busy} onClick={() => setDisputeOpen(disputeOpen === o.id ? null : o.id)}>{o.order_status === 'DISPUTED' ? 'Xem khiếu nại' : 'Khiếu nại'}</button>}
            </div>
            {reviewOpen === o.id && <ReviewPanel orderId={o.id} />}
            {disputeOpen === o.id && <DisputePanel orderId={o.id} role={mine(o) ? 'SELLER' : 'BUYER'} status={o.order_status} doneAt={o.completed_at ?? o.updated_at ?? o.created_at} onChanged={() => setReload(v => v + 1)} />}
            {prices[o.id] && <dl className="od-price"><dt>Tiền hàng</dt><dd>{moneyLabel(prices[o.id].subtotal)}</dd><dt>Giảm giá</dt><dd>{moneyLabel(prices[o.id].discount)}</dd><dt>Phí vận chuyển trong đơn</dt><dd>{moneyLabel(prices[o.id].shippingFee)}</dd><dt>Tổng thanh toán</dt><dd>{moneyLabel(prices[o.id].buyerTotal)}</dd>{mine(o) && <><dt>Phí nền tảng</dt><dd>{moneyLabel(prices[o.id].platformFee)}</dd><dt>Phí thanh toán</dt><dd>{moneyLabel(prices[o.id].paymentFee)}</dd><dt>Khoản trả người bán</dt><dd>{moneyLabel(prices[o.id].sellerPayout)}</dd></>}</dl>}
          </div>}
        </article>; })}
    </div>}
    {!loading && list.length > PAGE && <div className="od-pager"><button className="od-btn" disabled={cur <= 1} onClick={() => setPage(cur - 1)}><ChevronLeft size={16} />Trước</button><span>Trang {cur}/{pages} · {list.length} đơn</span><button className="od-btn" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Sau<ChevronRight size={16} /></button></div>}
  </div>;
}
