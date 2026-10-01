import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GeoController } from './geo.controller';

@Module({ imports: [AuthModule], controllers: [GeoController] })
export class GeoModule {}
