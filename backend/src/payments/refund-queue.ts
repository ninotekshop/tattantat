type Q = { query: (sql: string, values?: unknown[]) => Promise<{ rows: any[]; rowCount?: number | null }> };

/** Tạo yêu cầu hoàn tiền cho đơn đã thanh toán online nhưng bị hủy trước khi tất toán. Trả true nếu có tiền cần hoàn. */
export async function queueRefund(client: Q, orderId: string, reason: string): Promise<boolean> {
  const pay = (await client.query(`SELECT id, amount::text AS amount FROM payments WHERE order_id=$1 AND provider<>'COD' AND status='PAID' ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [orderId])).rows[0];
  if (!pay) return false;
  await client.query(`INSERT INTO payment_refund_tasks(payment_id, order_id, amount, reason) VALUES($1,$2,$3,$4) ON CONFLICT(payment_id) DO NOTHING`, [pay.id, orderId, pay.amount, reason]);
  await client.query(`UPDATE payments SET status='PROCESSING', updated_at=now() WHERE id=$1`, [pay.id]);
  await client.query(`UPDATE orders SET payment_status='PROCESSING', updated_at=now() WHERE id=$1`, [orderId]);
  return true;
}
