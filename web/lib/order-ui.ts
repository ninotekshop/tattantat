export const orderLabels: Record<string, string> = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', PREPARING: 'Đang chuẩn bị', SHIPPING: 'Đang giao', DELIVERED: 'Đã giao', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy', REFUNDED: 'Đã hoàn tiền', DISPUTED: 'Đang khiếu nại' };
export function isOnlineOrder(order: { payment_method?: string }): boolean { return !!order.payment_method && order.payment_method !== 'COD'; }
export function orderActions(order: { buyer_id: string; seller_id: string; order_status: string; payment_method?: string }, userId: string): string[] {
  if (order.seller_id === userId) return ({ PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PREPARING', 'CANCELLED'], PREPARING: ['SHIPPING'], SHIPPING: ['DELIVERED'], DELIVERED: ['COMPLETED'] } as Record<string, string[]>)[order.order_status]?.filter(a => !(a === 'COMPLETED' && isOnlineOrder(order))) ?? [];
  return order.buyer_id === userId && order.order_status === 'PENDING' ? ['CANCELLED'] : [];
}
export function moneyLabel(amount: string | number): string {
  const text = String(amount).replace(/\.0+$/, '');
  return /^\d+$/.test(text) ? BigInt(text).toLocaleString('vi-VN') + '\u00a0đ' : 'Chưa có giá';
}
