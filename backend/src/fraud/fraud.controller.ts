import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { FraudService, FraudSettings } from './fraud.service';

const ok = (data: unknown, message: string | null = null) => ({ success: true, data, message, errorCode: null });

@Controller('admin/risk')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminRiskController {
  constructor(private readonly fraud: FraudService) {}
  @Get('users') async users() { return ok(await this.fraud.riskUsers()); }
  @Get('settings') async settings() { return ok(await this.fraud.settings(true)); }
  @Put('settings') async save(@Req() r: { user: { id: string } }, @Body() body: { settings?: Partial<FraudSettings> }) { return ok(await this.fraud.saveSettings(r.user.id, body?.settings ?? {}), 'Đã lưu cài đặt chống lừa đảo.'); }
}
