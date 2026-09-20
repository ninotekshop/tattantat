import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CancelPayoutDto,
  CreateBankAccountDto,
  PayoutStatusDto,
  RequestPayoutDto,
  RefundOrderDto,
} from './dto/finance.dto';
import { BankAccountsService } from './bank-accounts.service';
import { PayoutsService } from './payouts.service';
import { RefundsService } from './refunds.service';
import { FinanceAdminGuard } from './finance-admin.guard';
import { NotificationsService } from '../account/notifications.service';
import { DatabaseService } from '../database/database.service';

type AuthenticatedRequest = { user: { id: string } };

@Controller('seller')
@UseGuards(JwtAuthGuard)
export class SellerFinanceController {
  constructor(
    private readonly payouts: PayoutsService,
    private readonly bankAccounts: BankAccountsService,
  ) {}

  @Get('wallet')
  async wallet(@Req() request: AuthenticatedRequest) {
    return { success: true, data: await this.payouts.wallet(request.user.id), message: null, errorCode: null };
  }

  @Get('revenue')
  async revenue(@Req() request: AuthenticatedRequest) {
    return { success: true, data: await this.payouts.revenue(request.user.id), message: null, errorCode: null };
  }

  @Get('payouts')
  async listPayouts(@Req() request: AuthenticatedRequest) {
    return { success: true, data: await this.payouts.list(request.user.id), message: null, errorCode: null };
  }

  @Post('payout')
  requestPayout(
    @Req() request: AuthenticatedRequest,
    @Body() body: RequestPayoutDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    return this.payouts.request(request.user.id, body, idempotencyKey);
  }

  @Post('payouts/:id/cancel')
  cancelPayout(
    @Req() request: AuthenticatedRequest,
    @Param('id') payoutId: string,
    @Body() body: CancelPayoutDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    return this.payouts.cancel(request.user.id, payoutId, body, idempotencyKey);
  }

  @Get('bank-accounts')
  async listBankAccounts(@Req() request: AuthenticatedRequest) {
    return { success: true, data: await this.bankAccounts.list(request.user.id), message: null, errorCode: null };
  }

  @Post('bank-accounts')
  async createBankAccount(@Req() request: AuthenticatedRequest, @Body() body: CreateBankAccountDto) {
    return { success: true, data: await this.bankAccounts.create(request.user.id, body), message: null, errorCode: null };
  }
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderRefundsController {
  constructor(private readonly refunds: RefundsService, private readonly db?: DatabaseService, private readonly notifications?: NotificationsService) {}

  @Get(':id/refunds')
  async list(@Req() request: AuthenticatedRequest, @Param('id') orderId: string) {
    return { success: true, data: await this.refunds.list(request.user.id, orderId), message: null, errorCode: null };
  }

  @Post(':id/refund')
  async refund(
    @Req() request: AuthenticatedRequest,
    @Param('id') orderId: string,
    @Body() body: RefundOrderDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    const result = await this.refunds.refund(request.user.id, orderId, body, idempotencyKey);
    const refund = result.data as { amount?: string; type?: string };
    if (this.db && this.notifications) {
      const owner = await this.db.query<{ buyer_id: string }>('SELECT buyer_id FROM orders WHERE id=$1', [orderId]);
      if (owner.rows[0]) {
        const title = refund.type === 'FULL_REFUND' ? 'Đơn hàng đã được hoàn tiền' : 'Đơn hàng được hoàn tiền một phần';
        void this.notifications.create(owner.rows[0].buyer_id, 'ORDER_REFUND', title, `Khoản hoàn ${refund.amount ?? '0'} đ đã được ghi nhận.`, 'ORDER', orderId).catch(() => undefined);
      }
    }
    return result;
  }
}

@Controller('admin/payouts')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminPayoutsController {
  constructor(private readonly payouts: PayoutsService, private readonly notifications?: NotificationsService) {}

  @Get()
  async list(@Query('status') rawStatus?: string, @Query('limit') rawLimit?: string) {
    const statuses = ['REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];
    if (rawStatus && !statuses.includes(rawStatus)) throw new BadRequestException('status payout không hợp lệ');
    const limit = Number(rawLimit ?? 100);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new BadRequestException('limit không hợp lệ');
    return { success: true, data: await this.payouts.listForAdmin(rawStatus as never, limit), message: null, errorCode: null };
  }

  @Post(':id/status')
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') payoutId: string,
    @Body() body: PayoutStatusDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    const result = await this.payouts.transitionByAdmin(request.user.id, payoutId, body, idempotencyKey);
    const payout = result.data as { sellerId?: string; status?: string; netAmount?: string };
    if (payout.sellerId && (payout.status === 'COMPLETED' || payout.status === 'FAILED')) {
      const title = payout.status === 'COMPLETED' ? 'Rút tiền thành công' : 'Rút tiền không thành công';
      const content = payout.status === 'COMPLETED'
        ? `Yêu cầu rút ${payout.netAmount ?? '0'} đ đã được chuyển thành công.`
        : 'Yêu cầu rút tiền không thành công; số dư đã được hoàn về ví khả dụng.';
      void this.notifications?.create(payout.sellerId, 'PAYOUT_STATUS', title, content, 'PAYOUT', payoutId).catch(() => undefined);
    }
    return result;
  }
}
