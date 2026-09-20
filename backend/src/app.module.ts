import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { ProductsModule } from './products/products.module';
import { StorageModule } from './storage/storage.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ChatModule } from './chat/chat.module';
import { AccountModule } from './account/account.module';
import { OrdersModule } from './orders/orders.module';
import { PricingModule } from './pricing/pricing.module';
import { FinanceModule } from './finance/finance.module';
import { PromotionsModule } from './promotions/promotions.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AdminModule } from './admin/admin.module';
import { AdvertisingModule } from './advertising/advertising.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ListingsModule } from './listings/listings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    AuthModule,
    ProductsModule,
    StorageModule,
    FavoritesModule,
    ChatModule,
    AccountModule,
    OrdersModule,
    PricingModule,
    FinanceModule,
    PromotionsModule,
    SubscriptionsModule,
    AdminModule,
    AdvertisingModule,
    PaymentsModule,
    ReviewsModule,
    ListingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
