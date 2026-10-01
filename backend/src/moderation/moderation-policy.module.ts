import { Global, Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { ModerationService } from '../admin/moderation.service';
import { ModerationAdminController } from './moderation-admin.controller';
import { ModerationBacklogService } from './moderation-backlog.service';
import { ModerationPolicyService } from './moderation-policy.service';

@Global()
@Module({ imports: [AuthModule, FinanceModule, AccountModule], controllers: [ModerationAdminController], providers: [ModerationService, ModerationPolicyService, ModerationBacklogService], exports: [ModerationPolicyService, ModerationBacklogService] })
export class ModerationPolicyModule {}
