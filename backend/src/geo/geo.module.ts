import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GeoAreaController, GeoController } from './geo.controller';

@Module({ imports: [AuthModule], controllers: [GeoController, GeoAreaController] })
export class GeoModule {}
