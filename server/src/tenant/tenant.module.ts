import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TenantBucketService } from './tenant-bucket.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [PrismaModule, FileModule],
  controllers: [TenantController],
  providers: [TenantService, TenantBucketService],
  exports: [TenantService, TenantBucketService],
})
export class TenantModule {}
