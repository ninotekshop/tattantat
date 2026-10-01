import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { AdminRiskController } from './fraud.controller';
import { FraudService } from './fraud.service';

@Global()
@Module({ imports: [AuthModule, FinanceModule], controllers: [AdminRiskController], providers: [FraudService], exports: [FraudService] })
export class FraudModule {}
