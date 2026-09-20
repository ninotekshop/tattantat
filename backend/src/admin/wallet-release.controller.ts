import { BadRequestException, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { IdempotencyService } from '../finance/idempotency.service';

/** Releases a completed order only after the marketplace's delivery/return
 * policy has elapsed. No ledger entry is needed: this is an internal wallet
 * state transfer, fully tied to the finalized order journal. */
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class WalletReleaseController {
  constructor(private readonly db: DatabaseService, private readonly idempotency: IdempotencyService) {}

  @Get('wallet/pending')
  async pending(@Query('limit') rawLimit?: string) {
    const limit = Math.min(Math.max(Number(rawLimit ?? 100) || 100, 1), 500);
    const result = await this.db.query(
      `SELECT o.id,o.order_code,wt.amount::text,u.full_name AS seller_name,o.completed_at
       FROM wallet_transactions wt JOIN orders o ON o.id=wt.order_id JOIN users u ON u.id=wt.seller_id
       WHERE wt.status='PENDING' AND o.order_status='COMPLETED'
       ORDER BY o.completed_at ASC NULLS LAST LIMIT $1`, [limit],
    );
    return { success: true, data: result.rows, message: null, errorCode: null };
  }

  @Post(':id/wallet/release')
  async release(@Req() request: { user: { id: string } }, @Param('id') orderId: string,
    @Headers('idempotency-key') key: string | undefined) {
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim(client, 'wallet-release', request.user.id, key, { orderId });
      if (claim.replay) return claim.replay;
      const order = await client.query<{ seller_id: string; order_status: string }>(
        `SELECT seller_id,order_status::text FROM orders WHERE id=$1 FOR UPDATE`, [orderId]);
      const row = order.rows[0];
      if (!row || row.order_status !== 'COMPLETED') throw new BadRequestException('Chỉ release ví của đơn đã hoàn tất');
      const walletEntry = await client.query<{ id: string; amount: string; status: string }>(
        `SELECT id,amount::text,status::text FROM wallet_transactions
         WHERE order_id=$1 AND seller_id=$2 ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [orderId, row.seller_id]);
      const entry = walletEntry.rows[0];
      if (!entry) throw new BadRequestException('Không có khoản ví chờ của đơn hàng');
      if (entry.status === 'AVAILABLE') {
        const response = { success: true, data: { orderId, released: false }, message: 'Khoản ví đã khả dụng', errorCode: null };
        await this.idempotency.complete(client, claim.scopedKey, response); return response;
      }
      if (entry.status !== 'PENDING') throw new BadRequestException('Khoản ví không ở trạng thái chờ');
      const amount = BigInt(entry.amount);
      const updated = await client.query(
        `UPDATE seller_wallets SET pending_balance=pending_balance-$2,available_balance=available_balance+$2,updated_at=NOW()
         WHERE seller_id=$1 AND pending_balance >= $2 RETURNING seller_id`, [row.seller_id, amount.toString()]);
      if (!updated.rows[0]) throw new BadRequestException('Số dư pending không khớp; cần đối soát thủ công');
      await client.query(`UPDATE wallet_transactions SET status='AVAILABLE' WHERE id=$1`, [entry.id]);
      await client.query(`INSERT INTO financial_audit_logs(actor_id,action,entity_type,entity_id,new_value)
        VALUES($1,'SELLER_WALLET_RELEASE','ORDER',$2,$3::jsonb)`, [request.user.id, orderId, JSON.stringify({ sellerId: row.seller_id, amount: amount.toString() })]);
      const response = { success: true, data: { orderId, released: true, amount: amount.toString(), currency: 'VND' }, message: 'Đã chuyển tiền vào số dư khả dụng', errorCode: null };
      await this.idempotency.complete(client, claim.scopedKey, response); return response;
    });
  }
}
