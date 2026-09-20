import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { PromotionMaintenanceService } from './promotion-maintenance.service';

@Controller('admin/promotions')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class PromotionExpiryController {
  constructor(private readonly maintenance: PromotionMaintenanceService) {}

  @Post('expire')
  async expire(@Req() request: { user: { id: string } }) {
    const result = await this.maintenance.expire(request.user.id);
    return { success: true, data: { expired: result }, message: null, errorCode: null };
  }
}
