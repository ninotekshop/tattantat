import { BadRequestException, Body, ConflictException, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { PricingService } from '../pricing/pricing.service';
import { IdempotencyService } from '../finance/idempotency.service';
import { NotificationsService } from '../account/notifications.service';
import { decimalToVnd } from '../finance/finance-money';

export class CreateOrderDto {
  @IsUUID() productId!: string;
  @IsOptional() @IsInt() @Min(1) @Max(1000) quantity?: number;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
  @IsOptional() @IsString() @Matches(/^[a-f0-9]{64}$/) quoteFingerprint?: string;
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly db: DatabaseService, private readonly pricing: PricingService, private readonly idempotency: IdempotencyService, private readonly notifications?: NotificationsService) {}

  @Get()
  async list(@Req() request: { user: { id: string } }) {
    const result = await this.db.query(
      `SELECT o.*,r.id AS review_id FROM orders o
       LEFT JOIN seller_reviews r ON r.order_id=o.id
       WHERE o.buyer_id=$1 OR o.seller_id=$1 ORDER BY o.created_at DESC`,
      [request.user.id],
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  @Get(':id/price')
  async price(@Req() request: { user: { id: string } }, @Param('id') id: string) {
    const result = await this.db.query<{
      pricing_version_id: string | null; platform_fee_rate_bps_snapshot: number; subtotal_amount: string;
      discount_amount: string; shipping_fee_amount: string; payment_fee_amount: string; platform_fee_amount: string;
      total_amount: string; seller_payout_amount: string;
    }>(
      `SELECT pricing_version_id,platform_fee_rate_bps_snapshot,subtotal_amount::text,discount_amount::text,
              shipping_fee_amount::text,payment_fee_amount::text,platform_fee_amount::text,total_amount::text,
              seller_payout_amount::text
       FROM orders WHERE id=$1 AND (buyer_id=$2 OR seller_id=$2)`,
      [id, request.user.id],
    );
    const row = result.rows[0];
    if (!row) throw new BadRequestException('Không tìm thấy đơn hàng');
    return {
      success: true,
      data: {
        pricingVersionId: row.pricing_version_id, platformFeeRateBps: row.platform_fee_rate_bps_snapshot,
        subtotal: row.subtotal_amount, discount: row.discount_amount, shippingFee: row.shipping_fee_amount,
        paymentFee: row.payment_fee_amount, platformFee: row.platform_fee_amount,
        buyerTotal: decimalToVnd(row.total_amount, 'Tổng thanh toán').toString(), sellerPayout: row.seller_payout_amount, currency: 'VND',
      }, message: null, errorCode: null,
    };
  }

  @Post()
  async create(@Req() request: { user: { id: string } }, @Body() body: CreateOrderDto, @Headers('idempotency-key') key: string | undefined) {
    const quantity = body.quantity ?? 1;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000) throw new BadRequestException('quantity phải là số nguyên từ 1 đến 1000');
    const orderCode = `TTT-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    const outcome = await this.db.transaction<{ response: { success: boolean; data: { id: string; orderCode: string; price: unknown }; message: null; errorCode: null }; created: boolean; sellerId?: string; productTitle?: string }>(async (client) => {
      const claim = await this.idempotency.claim(client, 'order-create', request.user.id, key, body);
      if (claim.replay) return { response: claim.replay as { success: boolean; data: { id: string; orderCode: string; price: unknown }; message: null; errorCode: null }, created: false };

      // The row lock makes availability check + order creation atomic. A second
      // buyer will wait here, then see RESERVED rather than create a duplicate order.
      const product = await client.query<{ id: string; seller_id: string; title: string; price: string }>(
        `SELECT id,seller_id,title,price::text FROM products p WHERE id=$1 AND status=$2 AND deleted_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$3 AND b.blocked_id=p.seller_id) OR (b.blocked_id=$3 AND b.blocker_id=p.seller_id)) FOR UPDATE`,
        [body.productId, 'ACTIVE', request.user.id],
      );
      const item = product.rows[0];
      if (!item || item.seller_id === request.user.id) throw new BadRequestException('Sản phẩm không hợp lệ hoặc đã có người đặt');
      const quote = await this.pricing.preview(item.id, quantity);
      if (body.quoteFingerprint && body.quoteFingerprint !== this.pricing.serializeQuote(quote).quoteFingerprint) {
        throw new ConflictException({ message: 'Giá hoặc phí đã thay đổi. Vui lòng tải lại báo giá và xác nhận lại.', errorCode: 'QUOTE_CHANGED' });
      }
      const order = await client.query<{ id: string }>(
        `INSERT INTO orders(
           order_code,buyer_id,seller_id,product_id,product_price,total_amount,payment_method,note,
           pricing_version_id,platform_fee_rate_bps_snapshot,platform_fee_amount,payment_fee_amount,
           seller_payout_amount,subtotal_amount,discount_amount,shipping_fee_amount
         ) VALUES($1,$2,$3,$4,$5,$6,'COD',$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [
          orderCode, request.user.id, item.seller_id, item.id, item.price, quote.buyerTotal.toString(),
          body.note ?? null, quote.pricingVersionId, quote.platformFeeRateBps, quote.platformFee.toString(),
          quote.paymentFee.toString(), quote.sellerPayout.toString(), quote.subtotal.toString(),
          quote.discountAmount.toString(), quote.shippingFee.toString(),
        ],
      );
      await client.query(
        `INSERT INTO order_items(order_id,product_id,seller_id,product_name,unit_price,quantity,subtotal)
         VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [order.rows[0].id, item.id, item.seller_id, item.title, item.price, quantity, quote.subtotal.toString()],
      );
      await client.query(`UPDATE products SET status='RESERVED', updated_at=NOW() WHERE id=$1 AND status='ACTIVE'`, [item.id]);
      const response = { success: true, data: { id: order.rows[0].id, orderCode, price: this.pricing.serializeQuote(quote) }, message: null, errorCode: null };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return { response, created: true, sellerId: item.seller_id, productTitle: item.title };
    });
    if (outcome.created && outcome.sellerId && outcome.productTitle) {
      void this.notifications?.create(outcome.sellerId, 'ORDER_CREATED', 'Bạn có đơn hàng mới', `Có đơn mới cho sản phẩm “${outcome.productTitle}”.`, 'ORDER', outcome.response.data.id).catch(() => undefined);
    }
    return outcome.response;
  }

  @Post(':id/status')
  async status(@Req() request: { user: { id: string } }, @Param('id') id: string, @Body('status') status: string) {
    const outcome = await this.db.transaction(async (client) => {
      const found = await client.query<{ buyer_id: string; seller_id: string; product_id: string; order_status: string }>(
        'SELECT buyer_id,seller_id,product_id,order_status::text FROM orders WHERE id=$1 FOR UPDATE', [id],
      );
      const order = found.rows[0];
      if (!order) throw new BadRequestException('Không tìm thấy đơn hàng');
      const isSeller = order.seller_id === request.user.id;
      const isBuyer = order.buyer_id === request.user.id;
      const allowedBySeller: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PREPARING', 'CANCELLED'],
        PREPARING: ['SHIPPING'], SHIPPING: ['DELIVERED'],
      };
      const allowed = isSeller ? allowedBySeller[order.order_status] ?? [] : isBuyer && order.order_status === 'PENDING' ? ['CANCELLED'] : [];
      if (!allowed.includes(status)) {
        throw new BadRequestException('Chuyển trạng thái đơn hàng không hợp lệ');
      }
      const result = await client.query(
        `UPDATE orders SET order_status=$1::order_status,updated_at=NOW() WHERE id=$2 RETURNING *`, [status, id],
      );
      if (status === 'CANCELLED') {
        await client.query(`UPDATE products SET status='ACTIVE',updated_at=NOW() WHERE id=$1 AND status='RESERVED'`, [order.product_id]);
      }
      const recipientId = isSeller ? order.buyer_id : order.seller_id;
      const labels: Record<string, string> = { CONFIRMED: 'đã được xác nhận', PREPARING: 'đang được chuẩn bị', SHIPPING: 'đang được giao', DELIVERED: 'đã giao thành công', CANCELLED: 'đã bị hủy' };
      return {
        response: { success: true, data: result.rows[0], message: null, errorCode: null },
        notification: { recipientId, content: `Đơn hàng ${labels[status] ?? 'đã được cập nhật'}.` },
      };
    });
    // Side effects must happen after commit: a rolled-back order transition
    // must never appear as a real notification to the other party.
    void this.notifications?.create(outcome.notification.recipientId, 'ORDER_STATUS', 'Cập nhật đơn hàng', outcome.notification.content, 'ORDER', id).catch(() => undefined);
    return outcome.response;
  }
}
