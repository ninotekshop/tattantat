import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountController } from './account.controller';
import { SafetyController } from './safety.controller';
import { NotificationsService } from './notifications.service';
import { MailerService } from './mailer.service';
import { NotificationPrefsController } from './notification-prefs.controller';
@Module({ imports: [AuthModule], controllers: [AccountController, SafetyController, NotificationPrefsController], providers: [NotificationsService, MailerService], exports: [NotificationsService, MailerService] })
export class AccountModule {}
