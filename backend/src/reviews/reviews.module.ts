import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { FinanceModule } from '../finance/finance.module';
import { AdminReviewsController, ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({ imports: [AuthModule, DatabaseModule, AccountModule, FinanceModule], controllers: [ReviewsController, AdminReviewsController], providers: [ReviewsService], exports: [ReviewsService] })
export class ReviewsModule {}
