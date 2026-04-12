import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FileService, MINIO_CLIENT } from './file.service';
import { FileController } from './file.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import * as Minio from 'minio';

@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    {
      provide: MINIO_CLIENT,
      useFactory: (configService: ConfigService) => {
        return new Minio.Client({
          endPoint: configService.get<string>('MINIO_ENDPOINT', 'localhost'),
          port: parseInt(configService.get<string>('MINIO_PORT', '9000')),
          useSSL:
            configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
          accessKey: configService.get<string>(
            'MINIO_ACCESS_KEY',
            'minioadmin',
          ),
          secretKey: configService.get<string>(
            'MINIO_SECRET_KEY',
            'minioadmin',
          ),
        });
      },
      inject: [ConfigService],
    },
    PrismaService,
    FileService,
  ],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
