'use client';
import { useEffect, useState } from 'react';
import { MemberArea } from '../../components/MemberArea';
import { memberRequest } from '../../lib/api';
import { moneyLabel, orderActions, orderLabels } from '../../lib/order-ui';
import type { WebSession } from '../../lib/auth';
type Order = { id: string; order_code: string; buyer_id: string; seller_id: string; order_status: string; total_amount: string; payment_status: string; payment_method: string; note: string | null; created_at: string };
type Price = { subtotal: string; discount: string; shippingFee: string; paymentFee: string; buyerTotal: string; platformFee: string; sellerPayout: string };
export default function OrdersPage() { return <MemberArea>{session => <Orders session={session}/>}</MemberArea>; }
function Orders({ session }: { session: WebSession }) {
  const [orders, setOrders] = useState<Order[]>([]), [prices, setPrices] = useState<Record<string, Price>>({});
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(''), [error, setError] = useState(''), [reload, setReload] = useState(0);
  const [filter, setFilter] = useState('all');
  useEffect(() => { let active = true; setLoading(true); memberRequest<Order[]>('/orders').then(items => { if (active) { setOrders(items); setError(''); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [reload]);
  async function transition(order: Order, status: string) {
    const text = status === 'COMPLETED' ? 'Xác nhận đã giao hàng và đã thu đủ tiền COD? Thao tác này ghi nhận doanh thu và khoản phải trả người bán.' : 'Chuyển đơn ' + order.order_code + ' sang “' + orderLabels[status] + '”?';
    if (busy || !window.confirm(text)) return; setBusy(order.id); setError('');
    try { await memberRequest('/orders/' + order.id + (status === 'COMPLETED' ? '/complete' : '/status'), 'POST', status === 'COMPLETED' ? {} : { status }); setReload(v => v + 1); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể cập nhật đơn. Hãy tải lại trước khi thử lại.'); } finally { setBusy(''); }
  }
  async function price(order: Order) { setBusy(order.id); setError(''); try { const value = await memberRequest<Price>('/orders/' + order.id + '/price'); setPrices(old => ({ ...old, [order.id]: value })); } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải giá.'); } finally { setBusy(''); } }
  const visible = orders.filter(o => filter === 'all' || (filter === 'buy' ? o.buyer_id === session.user.id : o.seller_id === session.user.id));
  return <><h1>Đơn hàng</h1><label>Hiển thị<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tất cả</option><option value="buy">Tôi mua</option><option value="sell">Tôi bán</option></select></label>{error && <p role="alert">{error}</p>}<button disabled={!!busy} onClick={() => setReload(v => v + 1)}>Tải lại</button>{loading ? <p>Đang tải đơn hàng...</p> : !visible.length ? <p className="member-card">Chưa có đơn hàng.</p> : visible.map(o => <article key={o.id} className="member-card"><h2>{o.order_code}</h2><p>{o.seller_id === session.user.id ? 'Đơn bán' : 'Đơn mua'} · {orderLabels[o.order_status] || o.order_status}</p><p className="member-price">{moneyLabel(o.total_amount)}</p><p>{o.payment_method} · {o.payment_status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p><p className="member-muted">{new Date(o.created_at).toLocaleString('vi-VN')}</p>{o.note && <p style={{ whiteSpace: 'pre-wrap' }}>{o.note}</p>}<div className="member-actions"><button disabled={!!busy} onClick={() => price(o)}>Chi tiết giá đã chốt</button>{orderActions(o, session.user.id).map(status => <button disabled={!!busy} key={status} onClick={() => transition(o, status)}>{status === 'COMPLETED' ? 'Xác nhận đã thu COD' : orderLabels[status]}</button>)}</div>{prices[o.id] && <dl><dt>Tiền hàng</dt><dd>{moneyLabel(prices[o.id].subtotal)}</dd><dt>Giảm giá</dt><dd>{moneyLabel(prices[o.id].discount)}</dd><dt>Phí vận chuyển trong đơn</dt><dd>{moneyLabel(prices[o.id].shippingFee)}</dd><dt>Tổng thanh toán</dt><dd>{moneyLabel(prices[o.id].buyerTotal)}</dd>{o.seller_id === session.user.id && <><dt>Phí nền tảng</dt><dd>{moneyLabel(prices[o.id].platformFee)}</dd><dt>Phí thanh toán</dt><dd>{moneyLabel(prices[o.id].paymentFee)}</dd><dt>Khoản trả người bán</dt><dd>{moneyLabel(prices[o.id].sellerPayout)}</dd></>}</dl>}</article>)}</>;
}
