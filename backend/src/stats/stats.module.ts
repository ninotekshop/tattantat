import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SellerStatsController } from './stats.controller';
import { SellerStatsService } from './seller-stats.service';

@Module({ imports: [AuthModule], controllers: [SellerStatsController], providers: [SellerStatsService] })
export class StatsModule {}
