import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GeoAreaController, GeoController } from './geo.controller';
import { AddressBackfillService } from './address-backfill.service';

@Module({ imports: [AuthModule], controllers: [GeoController, GeoAreaController], providers: [AddressBackfillService] })
export class GeoModule {}
