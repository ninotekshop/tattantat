import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { AdminRevenueController } from './admin-revenue.controller';
import { ReconciliationController } from './reconciliation.controller';
import { ShippingSettlementController } from './shipping-settlement.controller';
import { PricingAdminController } from './pricing-admin.controller';
import { WalletReleaseController } from './wallet-release.controller';
import { FinancialAuditController } from './financial-audit.controller';
import { PromotionExpiryController } from './promotion-expiry.controller';
import { ServicePricingAdminController } from './service-pricing-admin.controller';
import { PromotionMaintenanceService } from './promotion-maintenance.service';
import { RevenueProjectionService } from './revenue-projection.service';
import { CommercialLifecycleMaintenanceService } from './commercial-lifecycle-maintenance.service';
import { CommercialQueueController } from './commercial-queue.controller';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { AdminAuditLogService } from './admin-audit-log.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminPostsController } from './admin-posts.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminBannersController } from './admin-banners.controller';
import { PublicBannersController } from './public-banners.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminSearchController } from './admin-search.controller';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminAlertsController } from './admin-alerts.controller';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [AuthModule, FinanceModule, AccountModule],
  controllers: [
    AdminRevenueController,
    AdminDashboardController,
    AdminPostsController,
    AdminUsersController,
    AdminBannersController,
    PublicBannersController,
    AdminOrdersController,
    AdminSearchController,
    AdminNotificationsController,
    AdminAlertsController,
    ReconciliationController,
    ShippingSettlementController,
    PricingAdminController,
    WalletReleaseController,
    FinancialAuditController,
    PromotionExpiryController,
    ServicePricingAdminController,
    CommercialQueueController,
    ModerationController,
  ],
  providers: [
    AdminAuditLogService,
    ModerationService,
    PromotionMaintenanceService,
    RevenueProjectionService,
    CommercialLifecycleMaintenanceService,
  ],
  exports: [AdminAuditLogService, ModerationService],
})
export class AdminModule {}
