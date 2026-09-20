import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { ReviewsController } from './reviews.controller';

@Module({ imports: [AuthModule, DatabaseModule], controllers: [ReviewsController] })
export class ReviewsModule {}
