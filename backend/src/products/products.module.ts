import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ModerationService } from '../admin/moderation.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule],
  controllers: [ProductsController],
  providers: [ProductsService, ModerationService],
})
export class ProductsModule {}
