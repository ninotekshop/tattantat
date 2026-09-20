import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { IdempotencyService } from '../finance/idempotency.service';
import { LedgerWriterService } from '../finance/ledger-writer.service';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly db: DatabaseService, private readonly idempotency: IdempotencyService,
    private readonly ledger: LedgerWriterService) {}

  @Get('packages')
  async packages() {
    const result = await this.db.query(
      `SELECT p.id,p.code,p.name,v.id AS version_id,v.price,v.duration_hours,v.promotion_type
       FROM promotion_packages p JOIN promotion_package_versions v ON v.package_id=p.id
       WHERE p.status='ACTIVE' AND v.status='ACTIVE' AND v.effective_from<=NOW()
         AND (v.effective_to IS NULL OR v.effective_to>NOW()) ORDER BY v.price`,
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchase(@Req() request: { user: { id: string } }, @Headers('idempotency-key') key: string,
    @Body() body: { productId: string; packageId: string }) {
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim(client, 'promotion-purchase', request.user.id, key, body);
      if (claim.replay) return claim.replay;
      const product = await client.query('SELECT id FROM products WHERE id=$1 AND seller_id=$2 FOR UPDATE', [body.productId, request.user.id]);
      const packageRow = await client.query<{ id: string; version_id: string; price: string; duration_hours: number; promotion_type: string }>(
        `SELECT p.id,v.id AS version_id,v.price::text,v.duration_hours,v.promotion_type::text
         FROM promotion_packages p JOIN promotion_package_versions v ON v.package_id=p.id
         WHERE p.id=$1 AND p.status='ACTIVE' AND v.status='ACTIVE' AND v.effective_from<=NOW()
           AND (v.effective_to IS NULL OR v.effective_to>NOW()) FOR UPDATE OF p,v`, [body.packageId]);
      if (!product.rows[0] || !packageRow.rows[0]) throw new BadRequestException('Sản phẩm hoặc gói không hợp lệ');
      const row = packageRow.rows[0];
      const created = await client.query(
        `INSERT INTO promotion_orders(seller_id,product_id,package_id,package_version_id,package_price_snapshot,
          duration_hours_snapshot,promotion_type_snapshot,idempotency_key)
         VALUES($1,$2,$3,$4,$5,$6,$7::promotion_type,$8) RETURNING *`,
        [request.user.id, body.productId, row.id, row.version_id, row.price, row.duration_hours, row.promotion_type, claim.scopedKey],
      );
      const response = { success: true, data: created.rows[0], message: 'Chờ xác nhận thanh toán', errorCode: null };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return response;
    });
  }

  /** A gateway webhook will use this financial posting path only after its
   * signature verification. Manual settlement remains finance-admin only. */
  @Post('orders/:id/settle')
  @UseGuards(JwtAuthGuard, FinanceAdminGuard)
  async settle(@Req() request: { user: { id: string } }, @Param('id') id: string,
    @Headers('idempotency-key') key: string | undefined) {
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim(client, 'promotion-settle', request.user.id, key, { id });
      if (claim.replay) return claim.replay;
      const order = await client.query<{ id: string; seller_id: string; product_id: string; package_price_snapshot: string; status: string; promotion_type_snapshot: string; duration_hours_snapshot: number }>(
        `SELECT id,seller_id,product_id,package_price_snapshot::text,status::text,
                promotion_type_snapshot::text,duration_hours_snapshot
         FROM promotion_orders WHERE id=$1 FOR UPDATE`, [id]);
      const row = order.rows[0];
      if (!row) throw new BadRequestException('Không tìm thấy đơn đẩy tin');
      if (row.status !== 'PENDING') throw new BadRequestException('Đơn đẩy tin không còn chờ thanh toán');
      const amount = BigInt(row.package_price_snapshot);
      const transaction = await client.query<{ id: string }>(
        `INSERT INTO ledger_transactions(type,reference_id,idempotency_key,status)
         VALUES('PROMOTION_PURCHASE',$1,$2,'PENDING') RETURNING id`, [id, claim.scopedKey]);
      await this.ledger.finalize(client, transaction.rows[0].id, [
        { accountCode: 'PLATFORM_CASH', amount, userId: row.seller_id },
        { accountCode: 'PROMOTION_REVENUE', amount: -amount, userId: row.seller_id },
      ]);
      const updated = await client.query("UPDATE promotion_orders SET status='PAID',paid_at=NOW() WHERE id=$1 RETURNING *", [id]);
      await client.query(
        `INSERT INTO promotion_activations(promotion_order_id,product_id,promotion_type,starts_at,ends_at)
         VALUES($1,$2,$3::promotion_type,NOW(),NOW()+($4::text||' hours')::interval)
         ON CONFLICT(promotion_order_id) DO NOTHING`,
        [id, row.product_id, row.promotion_type_snapshot, row.duration_hours_snapshot],
      );
      if (row.promotion_type_snapshot === 'FEATURED') await client.query('UPDATE products SET is_featured=TRUE WHERE id=$1', [row.product_id]);
      const response = { success: true, data: updated.rows[0], message: 'Đã chốt thanh toán đẩy tin', errorCode: null };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return response;
    });
  }
}
