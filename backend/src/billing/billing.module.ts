import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountModule } from '../account/account.module';
import { FinanceModule } from '../finance/finance.module';
import { BillingAdminController, BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingExpiryService } from './billing-expiry.service';
import { CoinAdminController, WalletController } from './wallet.controller';

@Module({ imports: [AuthModule, FinanceModule, AccountModule], controllers: [BillingController, BillingAdminController, WalletController, CoinAdminController], providers: [BillingService, BillingExpiryService], exports: [BillingService] })
export class BillingModule {}
