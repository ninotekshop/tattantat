import { BadRequestException, Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IsInt } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { BillingService } from './billing.service';
import { assertDepositAmount, quoteDeposit } from './coin';

class AmountDto { @IsInt() amount!: number }
type Req_ = { user: { id: string } };
const envelope = <T>(data: T) => ({ success: true, data, message: null, errorCode: null });

function checked(amount: unknown): number {
  try { return assertDepositAmount(amount); } catch (e) { throw new BadRequestException((e as Error).message); }
}

/** Ví TTTCoin của thành viên. Backend tự tính VAT và Coin, không nhận coinAmount từ client. */
@Controller('wallet')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class WalletController {
  constructor(private readonly billing: BillingService) {}

  @Get() summary(@Req() r: Req_) { return this.billing.walletSummary(r.user.id); }
  @Post('coin/preview') preview(@Body() dto: AmountDto) { return envelope(quoteDeposit(checked(dto.amount))); }
  @Post('coin/deposit') deposit(@Req() r: Req_, @Body() dto: AmountDto) { return this.billing.createTopup(r.user.id, checked(dto.amount)); }
  @Get('transactions') transactions(@Req() r: Req_, @Query('filter') filter?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.billing.walletTransactions(r.user.id, filter, Number(page) || 1, Number(limit) || 20);
  }
}

/** Quản lý TTTCoin (quản trị): thống kê, danh sách giao dịch nạp, hoàn nạp. */
@Controller('admin/billing/coin')
@UseGuards(JwtAuthGuard, FinanceAdminGuard, ThrottlerGuard)
export class CoinAdminController {
  constructor(private readonly billing: BillingService) {}

  @Get('summary') summary() { return this.billing.coinAdminSummary(); }
  @Get('transactions') list(@Query('q') q?: string, @Query('status') status?: string, @Query('method') method?: string, @Query('from') from?: string, @Query('to') to?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.billing.coinAdminTransactions({ q, status, method, from, to, page: Number(page) || 1, limit: Number(limit) || 20 });
  }
}
