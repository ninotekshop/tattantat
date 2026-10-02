import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceAdminGuard } from '../finance/finance-admin.guard';
import { SystemFeaturesService } from './system-features.service';

class FeaturesDto {
  @IsOptional() @IsBoolean() maintenanceMode?: boolean;
  @IsOptional() @IsBoolean() allowRegistration?: boolean;
  @IsOptional() @IsBoolean() allowListingPublish?: boolean;
  @IsOptional() @IsBoolean() allowOrders?: boolean;
  @IsOptional() @IsBoolean() allowTopup?: boolean;
  @IsOptional() @IsBoolean() allowPackagePurchase?: boolean;
  @IsOptional() @IsBoolean() allowChat?: boolean;
  @IsOptional() @IsBoolean() allowReviews?: boolean;
}

@Controller('system')
export class SystemConfigController {
  constructor(private readonly features: SystemFeaturesService) {}
  /** Công khai: web đọc để hiện thông báo bảo trì. */
  @Get('config') async config() { return { success: true, data: await this.features.features(), message: null, errorCode: null }; }
}

@Controller('admin/system')
@UseGuards(JwtAuthGuard, FinanceAdminGuard)
export class AdminSystemController {
  constructor(private readonly features: SystemFeaturesService) {}
  @Get('features') async get() { return { success: true, data: await this.features.features(true), message: null, errorCode: null }; }
  @Put('features') save(@Req() r: { user: { id: string } }, @Body() dto: FeaturesDto) { return this.features.save(r.user.id, dto); }
}
