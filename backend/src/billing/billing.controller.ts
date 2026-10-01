import { Body, Controller, Get, Headers, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { BillingService } from './billing.service';

class TopupDto { @IsInt() amount!: number; }
class PlanDto { @IsString() @MaxLength(40) planId!: string; }
class PromoDto { @IsString() @MaxLength(40) productId!: string; @IsString() @MaxLength(40) packageId!: string; }
class ConfirmDto { @IsOptional() @IsNumber() receivedAmount?: number; }
class RejectDto { @IsString() @MaxLength(300) reason!: string; }
class ExtendDto { @IsInt() days!: number; }
class AdjustDto { @IsNumber() amount!: number; @IsString() @MaxLength(300) note!: string; }
class BankDto { @IsString() @MaxLength(10) bankBin!: string; @IsString() @MaxLength(60) bankName!: string; @IsString() @MaxLength(30) accountNumber!: string; @IsString() @MaxLength(60) accountName!: string; }
type Req_ = { user: { id: string } };

@Controller('billing')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}
  @Get('overview') overview(@Req() r: Req_) { return this.billing.overview(r.user.id); }
  @Get('transactions') transactions(@Req() r: Req_) { return this.billing.transactions(r.user.id); }
  @Get('topups') topups(@Req() r: Req_) { return this.billing.myTopups(r.user.id); }
  @Post('topups') topup(@Req() r: Req_, @Body() dto: TopupDto) { return this.billing.createTopup(r.user.id, dto.amount); }
  @Post('topups/:id/cancel') cancel(@Req() r: Req_, @Param('id') id: string) { return this.billing.cancelTopup(r.user.id, id); }
  @Post('subscriptions/purchase') buyPlan(@Req() r: Req_, @Body() dto: PlanDto, @Headers('idempotency-key') key?: string) { return this.billing.buyPlan(r.user.id, dto.planId, key); }
  @Post('promotions/purchase') buyPromo(@Req() r: Req_, @Body() dto: PromoDto, @Headers('idempotency-key') key?: string) { return this.billing.buyPromotion(r.user.id, dto.productId, dto.packageId, key); }
}

@Controller('admin/billing')
@UseGuards(JwtAuthGuard, FinanceAdminGuard, ThrottlerGuard)
export class BillingAdminController {
  constructor(private readonly billing: BillingService) {}
  @Get('customers') customers(@Query('q') q?: string, @Query('status') status?: string) { return this.billing.adminCustomers(q, status); }
  @Get('topups') topups(@Query('status') status?: string) { return this.billing.adminTopups(status); }
  @Post('topups/:id/confirm') confirm(@Req() r: Req_, @Param('id') id: string, @Body() dto: ConfirmDto) { return this.billing.confirmTopup(r.user.id, id, dto.receivedAmount); }
  @Post('topups/:id/reject') reject(@Req() r: Req_, @Param('id') id: string, @Body() dto: RejectDto) { return this.billing.rejectTopup(r.user.id, id, dto.reason); }
  @Post('subscriptions/:id/cancel') cancel(@Req() r: Req_, @Param('id') id: string) { return this.billing.adminCancel(r.user.id, id); }
  @Post('subscriptions/:id/extend') extend(@Req() r: Req_, @Param('id') id: string, @Body() dto: ExtendDto) { return this.billing.adminExtend(r.user.id, id, dto.days); }
  @Post('users/:userId/credit') adjust(@Req() r: Req_, @Param('userId') userId: string, @Body() dto: AdjustDto) { return this.billing.adjustCredit(r.user.id, userId, dto.amount, dto.note); }
  @Get('bank') async bank() { return { success: true, data: await this.billing.bank(), message: null, errorCode: null }; }
  @Put('bank') saveBank(@Req() r: Req_, @Body() dto: BankDto) { return this.billing.saveBank(r.user.id, dto); }
}
