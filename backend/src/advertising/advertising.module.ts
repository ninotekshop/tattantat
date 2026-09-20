import { Module } from '@nestjs/common'; import { AuthModule } from '../auth/auth.module'; import { FinanceModule } from '../finance/finance.module'; import { AdvertisingController } from './advertising.controller';
@Module({ imports: [AuthModule, FinanceModule], controllers: [AdvertisingController] }) export class AdvertisingModule {}
