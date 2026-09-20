import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { IdempotencyService } from '../finance/idempotency.service';
import { LedgerWriterService } from '../finance/ledger-writer.service';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class ShippingSettlementController {
  constructor(private readonly db: DatabaseService, private readonly idempotency: IdempotencyService, private readonly ledger: LedgerWriterService) {}

  @Get('shipping/pending')
  async pending(@Query('limit') rawLimit?: string) {
    const limit = Number(rawLimit ?? 100);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new BadRequestException('limit không hợp lệ');
    const orders = await this.db.query(
      `SELECT o.id,o.order_code,o.shipping_fee_amount::text AS customer_fee,o.completed_at,
              seller.full_name AS seller_name,buyer.full_name AS buyer_name
       FROM orders o JOIN users seller ON seller.id=o.seller_id JOIN users buyer ON buyer.id=o.buyer_id
       LEFT JOIN shipping_transactions s ON s.order_id=o.id
       WHERE o.order_status='COMPLETED' AND o.shipping_fee_amount>0 AND s.id IS NULL
       ORDER BY o.completed_at ASC NULLS LAST LIMIT $1`, [limit],
    );
    return { success: true, data: orders.rows, meta: { limit }, message: null, errorCode: null };
  }

  @Post(':id/shipping/settle')
  async settle(@Req() request: { user: { id: string } }, @Param('id') orderId: string,
    @Body('providerCost') providerCostRaw: string, @Headers('idempotency-key') key: string | undefined) {
    if (!/^(0|[1-9]\d{0,14})$/.test(String(providerCostRaw))) throw new BadRequestException('providerCost phải là số tiền VND nguyên không âm');
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim(client, 'shipping-settle', request.user.id, key, { orderId, providerCost: providerCostRaw });
      if (claim.replay) return claim.replay;
      const order = await client.query<{ shipping_fee_amount: string; order_status: string }>(
        `SELECT shipping_fee_amount::text,order_status::text FROM orders WHERE id=$1 FOR UPDATE`, [orderId]);
      const row = order.rows[0];
      if (!row || row.order_status !== 'COMPLETED') throw new BadRequestException('Chỉ đối soát vận chuyển của đơn đã hoàn tất');
      const exists = await client.query(`SELECT id FROM shipping_transactions WHERE order_id=$1 FOR UPDATE`, [orderId]);
      if (exists.rows[0]) throw new BadRequestException('Đơn đã có giao dịch vận chuyển');
      const customerFee = BigInt(row.shipping_fee_amount); const providerCost = BigInt(providerCostRaw); const margin = customerFee - providerCost;
      if (customerFee === 0n) throw new BadRequestException('Đơn không có phí vận chuyển để đối soát');
      const shipping = await client.query<{ id: string }>(`INSERT INTO shipping_transactions(order_id,customer_fee,provider_cost,platform_margin) VALUES($1,$2,$3,$4) RETURNING id`, [orderId, customerFee.toString(), providerCost.toString(), margin.toString()]);
      const journal = await client.query<{ id: string }>(`INSERT INTO ledger_transactions(type,order_id,reference_id,idempotency_key,status) VALUES('SHIPPING_SETTLEMENT',$1,$2,$3,'PENDING') RETURNING id`, [orderId, shipping.rows[0].id, claim.scopedKey]);
      const lines = [
        ...(customerFee > 0n ? [{ accountCode: 'SHIPPING_CLEARING', amount: customerFee, orderId }] : []),
        ...(providerCost > 0n ? [{ accountCode: 'PLATFORM_CASH', amount: -providerCost, orderId }] : []),
        ...(margin !== 0n ? [{ accountCode: 'SHIPPING_MARGIN', amount: -margin, orderId }] : []),
      ];
      await this.ledger.finalize(client, journal.rows[0].id, lines);
      const updated = await client.query(`UPDATE shipping_transactions SET status='SETTLED',ledger_transaction_id=$2,settled_by=$3,settled_at=NOW(),updated_at=NOW() WHERE id=$1 RETURNING *`, [shipping.rows[0].id, journal.rows[0].id, request.user.id]);
      const response = { success: true, data: updated.rows[0], message: 'Đã đối soát phí vận chuyển', errorCode: null };
      await this.idempotency.complete(client, claim.scopedKey, response); return response;
    });
  }
}
