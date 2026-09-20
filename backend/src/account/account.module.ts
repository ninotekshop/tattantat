import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountController } from './account.controller';
import { SafetyController } from './safety.controller';
import { NotificationsService } from './notifications.service';
@Module({ imports: [AuthModule], controllers: [AccountController, SafetyController], providers: [NotificationsService], exports: [NotificationsService] })
export class AccountModule {}
