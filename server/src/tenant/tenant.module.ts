import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TenantBucketService } from './tenant-bucket.service';
import { PrismaModule } from '../prisma/prisma.module';
import * as Minio from 'minio';

const MINIO_CLIENT = 'MINIO_CLIENT';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [
    {
      provide: MINIO_CLIENT,
      useFactory: (configService: ConfigService) => {
        return new Minio.Client({
          endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
          port: parseInt(configService.get<string>('MINIO_PORT', '9000')),
          useSSL: configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
          accessKey: configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
          secretKey: configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
        });
      },
      inject: [ConfigService],
    },
    TenantService,
    TenantBucketService,
  ],
  controllers: [TenantController],
  exports: [TenantService, TenantBucketService],
})
export class TenantModule {}
