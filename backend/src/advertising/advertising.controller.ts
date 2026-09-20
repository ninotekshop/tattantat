import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { IdempotencyService } from '../finance/idempotency.service';
import { LedgerWriterService } from '../finance/ledger-writer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DatabaseService } from '../database/database.service';

type CampaignInput = { productId?: string; campaignType: string; budget: string; startAt?: string; endAt?: string };

@Controller('advertising')
@UseGuards(JwtAuthGuard)
export class AdvertisingController {
  constructor(private readonly db: DatabaseService, private readonly idempotency: IdempotencyService,
    private readonly ledger: LedgerWriterService) {}

  @Get('campaigns')
  async list(@Req() request: { user: { id: string } }) {
    const campaigns = await this.db.query('SELECT * FROM advertising_campaigns WHERE seller_id=$1 ORDER BY created_at DESC', [request.user.id]);
    return { success: true, data: campaigns.rows, message: null, errorCode: null };
  }

  @Post('campaigns')
  async create(@Req() request: { user: { id: string } }, @Body() body: CampaignInput,
    @Headers('idempotency-key') key: string | undefined) {
    if (!/^[1-9]\d{0,14}$/.test(String(body.budget))) throw new BadRequestException('Budget phải là số tiền VND nguyên dương');
    const allowed = ['SPONSORED_PRODUCT', 'SPONSORED_SEARCH', 'BANNER', 'CATEGORY_PROMOTION', 'SHOP_PROMOTION'];
    if (!allowed.includes(body.campaignType)) throw new BadRequestException('Loại quảng cáo không hợp lệ');
    const startAt = this.date(body.startAt) ?? new Date();
    const endAt = this.date(body.endAt) ?? new Date(startAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (endAt <= startAt) throw new BadRequestException('endAt phải sau startAt');
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim<{ success: boolean; data: unknown; message: string | null; errorCode: string | null }>(
        client, 'advertising-create', request.user.id, key, body,
      );
      if (claim.replay) return claim.replay;
      if (body.productId) {
        const product = await client.query('SELECT id FROM products WHERE id=$1 AND seller_id=$2 AND status=\'ACTIVE\' FOR UPDATE', [body.productId, request.user.id]);
        if (!product.rows[0]) throw new BadRequestException('Sản phẩm quảng cáo không hợp lệ');
      }
      const campaign = await client.query(
        `INSERT INTO advertising_campaigns(seller_id,product_id,campaign_type,budget,status,start_at,end_at)
         VALUES($1,$2,$3,$4,'PENDING_PAYMENT',$5,$6) RETURNING *`,
        [request.user.id, body.productId ?? null, body.campaignType, body.budget, startAt.toISOString(), endAt.toISOString()],
      );
      const response = { success: true, data: campaign.rows[0], message: 'Chờ xác nhận thanh toán', errorCode: null };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return response;
    });
  }

  @Post('campaigns/:id/settle')
  @UseGuards(FinanceAdminGuard)
  async settle(@Req() request: { user: { id: string } }, @Param('id') id: string,
    @Headers('idempotency-key') key: string | undefined) {
    return this.db.transaction(async (client) => {
      const claim = await this.idempotency.claim(client, 'advertising-settle', request.user.id, key, { id });
      if (claim.replay) return claim.replay;
      const found = await client.query<{ seller_id: string; budget: string; status: string; start_at: Date; end_at: Date }>(
        `SELECT seller_id,budget::text,status,start_at,end_at FROM advertising_campaigns WHERE id=$1 FOR UPDATE`, [id]);
      const campaign = found.rows[0];
      if (!campaign || campaign.status !== 'PENDING_PAYMENT') throw new BadRequestException('Campaign không còn chờ thanh toán');
      if (campaign.end_at && campaign.end_at <= new Date()) throw new BadRequestException('Campaign đã hết hạn trước khi thanh toán');
      const amount = BigInt(campaign.budget);
      const transaction = await client.query<{ id: string }>(
        `INSERT INTO ledger_transactions(type,reference_id,idempotency_key,status)
         VALUES('ADVERTISING_PURCHASE',$1,$2,'PENDING') RETURNING id`, [id, claim.scopedKey]);
      await this.ledger.finalize(client, transaction.rows[0].id, [
        { accountCode: 'PLATFORM_CASH', amount, userId: campaign.seller_id },
        { accountCode: 'ADVERTISING_REVENUE', amount: -amount, userId: campaign.seller_id },
      ]);
      const updated = await client.query(
        `UPDATE advertising_campaigns SET status='ACTIVE',start_at=COALESCE(start_at,NOW()),paid_at=NOW(),
         ledger_transaction_id=$2,updated_at=NOW() WHERE id=$1 RETURNING *`, [id, transaction.rows[0].id]);
      const response = { success: true, data: updated.rows[0], message: 'Đã chốt doanh thu và kích hoạt campaign', errorCode: null };
      await this.idempotency.complete(client, claim.scopedKey, response);
      return response;
    });
  }

  private date(value?: string): Date | undefined {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new BadRequestException('Thời gian campaign không hợp lệ');
    return parsed;
  }
}
