import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { AdminDisputesController, DisputeReasonsController, OrderDisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';

@Module({ imports: [AuthModule, AccountModule, FinanceModule], controllers: [OrderDisputesController, DisputeReasonsController, AdminDisputesController], providers: [DisputesService], exports: [DisputesService] })
export class DisputesModule {}
