import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { decimalToVnd } from './finance-money';
import { LedgerLine, LedgerWriterService } from './ledger-writer.service';

interface CompletedOrder {
  id: string;
  seller_id: string;
  product_id: string;
  total_amount: string;
  platform_fee_amount: string;
  payment_fee_amount: string;
  seller_payout_amount: string;
  shipping_fee_amount: string;
}

@Injectable()
export class LedgerService {
  constructor(private readonly db: DatabaseService, private readonly writer: LedgerWriterService) {}

  /** Atomically completes an order, creates its balanced journal and credits the
   * seller's pending wallet. Retrying the endpoint cannot create another journal. */
  async completeOrder(orderId: string, sellerId: string) {
    return this.db.transaction(async (client) => {
      const order = await client.query<CompletedOrder>(
        `SELECT id, seller_id, product_id, total_amount::text, platform_fee_amount::text,
                payment_fee_amount::text, seller_payout_amount::text, shipping_fee_amount::text
         FROM orders WHERE id=$1 FOR UPDATE`,
        [orderId],
      );
      const row = order.rows[0];
      if (!row || row.seller_id !== sellerId) throw new BadRequestException('Không tìm thấy đơn hàng của người bán');

      const existing = await client.query<{ id: string }>(
        `SELECT id FROM ledger_transactions
         WHERE order_id=$1 AND type='ORDER_PAYMENT' AND status='FINALIZED' LIMIT 1`,
        [orderId],
      );
      if (existing.rows[0]) {
        await client.query(`UPDATE orders SET order_status='COMPLETED', completed_at=COALESCE(completed_at,NOW()) WHERE id=$1`, [orderId]);
        await client.query(`UPDATE products SET status='SOLD',updated_at=NOW() WHERE id=$1 AND status='RESERVED'`, [row.product_id]);
        return { ledgerTransactionId: existing.rows[0].id, replay: true };
      }

      const eligible = await client.query<{ id: string }>(
        `UPDATE orders SET order_status='COMPLETED', completed_at=NOW(), updated_at=NOW()
         WHERE id=$1 AND order_status='DELIVERED' RETURNING id`,
        [orderId],
      );
      if (!eligible.rows[0]) throw new BadRequestException('Đơn hàng chưa đủ điều kiện hoàn tất');
      await client.query(`UPDATE products SET status='SOLD',updated_at=NOW() WHERE id=$1 AND status='RESERVED'`, [row.product_id]);

      const gross = decimalToVnd(row.total_amount, 'Tổng đơn hàng');
      const platformFee = decimalToVnd(row.platform_fee_amount, 'Phí nền tảng');
      const paymentFee = decimalToVnd(row.payment_fee_amount, 'Phí thanh toán');
      const sellerPayout = decimalToVnd(row.seller_payout_amount, 'Khoản trả người bán');
      const shipping = decimalToVnd(row.shipping_fee_amount, 'Phí vận chuyển');
      const payment = await client.query<{ id: string; provider: string; status: string }>(
        `SELECT id, provider, status::text FROM payments
         WHERE order_id=$1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [orderId],
      );
      let paymentId = payment.rows[0]?.id;
      if (!paymentId) {
        const createdPayment = await client.query<{ id: string }>(
          `INSERT INTO payments(order_id,user_id,payment_code,provider,amount,currency,status,paid_at)
           SELECT id,buyer_id,'COD-' || replace(id::text,'-',''),'COD',$2,'VND','PAID',NOW()
           FROM orders WHERE id=$1 RETURNING id`,
          [orderId, gross.toString()],
        );
        paymentId = createdPayment.rows[0].id;
      } else {
        const existingPayment = payment.rows[0];
        if (existingPayment.provider !== 'COD' && existingPayment.status !== 'PAID') {
          throw new BadRequestException('Thanh toán trực tuyến chưa được xác nhận bởi cổng thanh toán');
        }
        await client.query(
          `UPDATE payments SET status='PAID', paid_at=COALESCE(paid_at,NOW()), updated_at=NOW() WHERE id=$1`,
          [paymentId],
        );
      }
      await client.query(`UPDATE orders SET payment_status='PAID', updated_at=NOW() WHERE id=$1`, [orderId]);
      const lines: LedgerLine[] = [
        { accountCode: 'CASH_CLEARING', amount: gross, orderId },
        { accountCode: 'SELLER_PAYABLE', amount: -sellerPayout, userId: row.seller_id, orderId },
        ...(platformFee > 0n ? [{ accountCode: 'PLATFORM_REVENUE', amount: -platformFee, orderId }] : []),
        ...(paymentFee > 0n ? [{ accountCode: 'PAYMENT_PROCESSING_FEE', amount: -paymentFee, orderId }] : []),
        ...(shipping > 0n ? [{ accountCode: 'SHIPPING_CLEARING', amount: -shipping, orderId }] : []),
      ];
      const imbalance = lines.reduce((sum, line) => sum + line.amount, 0n);
      if (imbalance !== 0n) {
        throw new BadRequestException('RECONCILIATION_ERROR: snapshot đơn hàng không cân bằng');
      }

      const transaction = await client.query<{ id: string }>(
        `INSERT INTO ledger_transactions(type, order_id, payment_id, status)
         VALUES('ORDER_PAYMENT',$1,$2,'PENDING') RETURNING id`,
        [orderId, paymentId],
      );
      await this.writer.finalize(client, transaction.rows[0].id, lines);
      if (sellerPayout > 0n) {
        await client.query(
          `INSERT INTO seller_wallets(seller_id,pending_balance) VALUES($1,$2)
           ON CONFLICT(seller_id) DO UPDATE SET pending_balance=seller_wallets.pending_balance+EXCLUDED.pending_balance, updated_at=NOW()`,
          [row.seller_id, sellerPayout.toString()],
        );
        await client.query(
          `INSERT INTO wallet_transactions(seller_id,order_id,ledger_transaction_id,status,amount)
           VALUES($1,$2,$3,'PENDING',$4)`,
          [row.seller_id, orderId, transaction.rows[0].id, sellerPayout.toString()],
        );
      }
      return { ledgerTransactionId: transaction.rows[0].id, replay: false };
    });
  }
}
