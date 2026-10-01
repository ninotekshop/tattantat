import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { OnlinePaymentsService } from './online-payments.service';
import { EscrowService } from './escrow.service';

class OnlineDto { @IsUUID() orderId!: string; }
class NoteDto { @IsString() @MaxLength(500) note!: string; }
class SettingsDto { @IsOptional() @IsInt() @Min(5) @Max(1440) paymentExpiryMinutes?: number; @IsOptional() @IsInt() @Min(1) @Max(30) autoConfirmDays?: number; @IsOptional() @IsInt() @Min(1) @Max(30) shipDeadlineDays?: number; }
class SettingsBody { @IsOptional() settings?: SettingsDto; }
type Req_ = { user: { id: string } };

@Controller('payments')
export class OnlinePaymentsController {
  constructor(private readonly svc: OnlinePaymentsService) {}
  /** Webhook từ cổng thanh toán: không dùng JWT, được xác thực bằng chữ ký. */
  @Post('webhook/:provider') @HttpCode(200) webhook(@Param('provider') provider: string, @Body() body: Record<string, unknown>) { return this.svc.handleWebhook(provider, body); }
  @Get('options') @UseGuards(JwtAuthGuard) options() { return this.svc.options(); }
  @Post('online') @UseGuards(JwtAuthGuard) online(@Req() r: Req_, @Body() b: OnlineDto) { return this.svc.createOnline(r.user.id, b.orderId); }
  @Get('order/:id') @UseGuards(JwtAuthGuard) status(@Req() r: Req_, @Param('id') id: string) { return this.svc.orderPayment(r.user.id, id); }
  @Get('order/:id/qr') @UseGuards(JwtAuthGuard) qr(@Req() r: Req_, @Param('id') id: string) { return this.svc.qrInfo(r.user.id, id); }
  @Post('order/:id/sync') @UseGuards(JwtAuthGuard) sync(@Req() r: Req_, @Param('id') id: string) { return this.svc.syncOnline(r.user.id, id); }
  @Post('mock/:code/pay') @UseGuards(JwtAuthGuard) mockPay(@Req() r: Req_, @Param('code', ParseIntPipe) code: number) { return this.svc.mockPay(r.user.id, code); }
}

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminPaymentsController {
  constructor(private readonly svc: OnlinePaymentsService, private readonly escrow: EscrowService) {}
  @Get() list(@Query('status') status = '', @Query('q') q = '', @Query('page') page = '1') { return this.svc.adminList(String(status).toUpperCase(), String(q), Number(page)); }
  @Get('reconcile') reconcile() { return this.svc.reconcile(); }
  @Get('refund-tasks') tasks(@Query('status') status = 'PENDING') { return this.svc.refundTasks(String(status).toUpperCase()); }
  @Post('refund-tasks/:id/done') done(@Req() r: Req_, @Param('id') id: string, @Body() b: NoteDto) { return this.svc.completeRefund(r.user.id, id, b.note); }
  @Get('settings') async settings() { return { success: true, data: await this.svc.settings(true), message: null, errorCode: null }; }
  @Put('settings') async save(@Req() r: Req_, @Body() b: SettingsBody) { return { success: true, data: await this.svc.saveSettings(r.user.id, b.settings ?? {}), message: 'Đã lưu cài đặt thanh toán đảm bảo.', errorCode: null }; }
  @Post('run-jobs') async run() { return { success: true, data: await this.escrow.run(), message: 'Đã chạy tác vụ thanh toán đảm bảo.', errorCode: null }; }
}
