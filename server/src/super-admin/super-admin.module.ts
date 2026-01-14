import { Module } from '@nestjs/common';
import { SuperAdminController } from './super-admin.controller';
import { TenantModule } from '../tenant/tenant.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, TenantModule],
  controllers: [SuperAdminController],
})
export class SuperAdminModule {}
