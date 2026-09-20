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

@Module({ imports: [AuthModule, FinanceModule], controllers: [AdminRevenueController, ReconciliationController, ShippingSettlementController, PricingAdminController, WalletReleaseController, FinancialAuditController, PromotionExpiryController, ServicePricingAdminController, CommercialQueueController, ModerationController], providers: [PromotionMaintenanceService, RevenueProjectionService, CommercialLifecycleMaintenanceService] })
export class AdminModule {}
