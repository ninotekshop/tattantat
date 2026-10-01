import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AccountModule } from '../account/account.module';
import { ListingsService } from './listings.service';
import { ListingMediaService } from './listing-media.service';
import { ListingAdminService } from './listing-admin.service';
import { CatalogSyncService } from './catalog-sync.service';
import { ListingAdminController, ListingsController, ListingTemplatesController } from './listings.controller';
@Module({imports:[AuthModule,AccountModule],controllers:[ListingTemplatesController,ListingsController,ListingAdminController],providers:[ListingsService,ListingMediaService,CatalogSyncService,ListingAdminService]})
export class ListingsModule {}
