import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ListingsService } from './listings.service';
import { ListingMediaService } from './listing-media.service';
import { ListingAdminController, ListingsController, ListingTemplatesController } from './listings.controller';
@Module({imports:[AuthModule],controllers:[ListingTemplatesController,ListingsController,ListingAdminController],providers:[ListingsService,ListingMediaService]})
export class ListingsModule {}
