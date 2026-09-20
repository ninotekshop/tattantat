import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { decimalToVnd, money } from '../finance/finance-money';
import { IdempotencyService } from '../finance/idempotency.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

interface OrderForPayment {
  id: string;
  buyer_id: string;
  total_amount: string;
  payment_status: string;
}

interface PaymentRow {
  id: string;
  order_id: string;
  payment_code: string;
  provider: string;
  amount: string;
  currency: string;
  status: string;
  paid_at: Date | null;
  created_at: Date;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly db: DatabaseService, private readonly idempotency: IdempotencyService) {}

  async create(actorId: string, dto: CreatePaymentDto, rawIdempotencyKey: string | undefined) {
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim<{ success: boolean; data: unknown; message: string | null; errorCode: string | null }>(
        client, 'payment-create', actorId, rawIdempotencyKey, dto,
      );
      if (claim.replay) return claim.replay;

      const order = await client.query<OrderForPayment>(
        `SELECT id, buyer_id, total_amount::text, payment_status::text FROM orders WHERE id=$1 FOR UPDATE`,
        [dto.orderId],
      );
      const row = order.rows[0];
      if (!row || row.buyer_id !== actorId) throw new BadRequestException('Không tìm thấy đơn hàng của bạn');
      if (row.payment_status === 'PAID') throw new ConflictException('Đơn hàng đã thanh toán');

      const active = await client.query<PaymentRow>(
        `SELECT id, order_id, payment_code, provider, amount::text, currency, status::text, paid_at, created_at
         FROM payments WHERE order_id=$1 AND status='PENDING' ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [dto.orderId],
      );
      let payment = active.rows[0];
      if (!payment) {
        const amount = decimalToVnd(row.total_amount, 'Tổng thanh toán');
        const inserted = await client.query<PaymentRow>(
          `INSERT INTO payments(order_id,user_id,payment_code,provider,amount,currency,status)
           VALUES($1,$2,$3,'COD',$4,'VND','PENDING')
           RETURNING id, order_id, payment_code, provider, amount::text, currency, status::text, paid_at, created_at`,
          [dto.orderId, actorId, `COD-${randomUUID()}`, amount.toString()],
        );
        payment = inserted.rows[0];
      }
      const response = { success: true, data: this.publicPayment(payment), message: 'Đã ghi nhận yêu cầu COD', errorCode: null };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return response;
    });
  }

  private publicPayment(payment: PaymentRow) {
    return {
      id: payment.id,
      orderId: payment.order_id,
      paymentCode: payment.payment_code,
      provider: payment.provider,
      amount: money(decimalToVnd(payment.amount, 'Số tiền thanh toán')),
      currency: payment.currency,
      status: payment.status,
      paidAt: payment.paid_at,
      createdAt: payment.created_at,
    };
  }
}
