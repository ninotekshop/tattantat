import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { EscrowService } from './escrow.service';
import { OnlinePaymentsService } from './online-payments.service';
import { AdminPaymentsController, OnlinePaymentsController } from './online-payments.controller';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuthModule, AccountModule, FinanceModule],
  controllers: [PaymentsController, OnlinePaymentsController, AdminPaymentsController],
  providers: [PaymentsService, OnlinePaymentsService, EscrowService],
  exports: [OnlinePaymentsService],
})
export class PaymentsModule {}
