import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AdminAuditLogService } from '../admin/admin-audit-log.service';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { AdminVerificationController, VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({ imports: [AuthModule, AccountModule, FinanceModule], controllers: [VerificationController, AdminVerificationController], providers: [VerificationService, AdminAuditLogService], exports: [VerificationService] })
export class VerificationModule {}
