import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SellerStatsService } from './seller-stats.service';

@Controller('seller/stats')
@UseGuards(JwtAuthGuard)
export class SellerStatsController {
  constructor(private readonly stats: SellerStatsService) {}
  @Get() overview(@Req() r: { user: { id: string } }, @Query('days') days?: string) { return this.stats.overview(r.user.id, days); }
}
