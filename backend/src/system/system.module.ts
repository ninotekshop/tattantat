import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { SystemFeaturesGuard } from './system-features.guard';
import { AdminSystemController, SystemConfigController } from './system-features.controller';
import { SystemFeaturesService } from './system-features.service';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [SystemConfigController, AdminSystemController],
  providers: [SystemFeaturesService, { provide: APP_GUARD, useClass: SystemFeaturesGuard }],
  exports: [SystemFeaturesService],
})
export class SystemModule {}
