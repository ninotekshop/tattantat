import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountModule } from '../account/account.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { IdempotencyService } from '../finance/idempotency.service';
@Module({ imports: [AuthModule, AccountModule], controllers: [ChatController], providers: [ChatService, IdempotencyService] })
export class ChatModule {}
