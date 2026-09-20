import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountModule } from '../account/account.module';
import { PricingModule } from '../pricing/pricing.module';
import { OrdersController } from './orders.controller';
import { OrderFinancialController } from './order-financial.controller';
@Module({ imports: [AuthModule, AccountModule, PricingModule], controllers: [OrdersController, OrderFinancialController] })
export class OrdersModule {}
