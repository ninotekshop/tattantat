import { Module } from '@nestjs/common'; import { AuthModule } from '../auth/auth.module'; import { FinanceModule } from '../finance/finance.module'; import { SubscriptionsController } from './subscriptions.controller';
@Module({ imports: [AuthModule, FinanceModule], controllers: [SubscriptionsController] }) export class SubscriptionsModule {}
