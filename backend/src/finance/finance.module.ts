import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountModule } from '../account/account.module';
import { BankAccountsService } from './bank-accounts.service';
import { FinanceAuthorizationService } from './finance-authorization.service';
import { FinanceAdminGuard } from './finance-admin.guard';
import { AdminPayoutsController, OrderRefundsController, SellerFinanceController } from './finance.controller';
import { IdempotencyService } from './idempotency.service';
import { LedgerWriterService } from './ledger-writer.service';
import { LedgerService } from './ledger.service';
import { PayoutsService } from './payouts.service';
import { RefundsService } from './refunds.service';

@Global()
@Module({
  imports: [AuthModule, AccountModule],
  controllers: [SellerFinanceController, OrderRefundsController, AdminPayoutsController],
  providers: [
    LedgerService,
    LedgerWriterService,
    IdempotencyService,
    FinanceAuthorizationService,
    FinanceAdminGuard,
    BankAccountsService,
    PayoutsService,
    RefundsService,
  ],
  exports: [LedgerService, LedgerWriterService, IdempotencyService, FinanceAuthorizationService, FinanceAdminGuard, PayoutsService, RefundsService],
})
export class FinanceModule {}
