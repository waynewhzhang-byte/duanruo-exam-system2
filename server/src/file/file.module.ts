import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileService, MINIO_CLIENT } from './file.service';
import { FileController } from './file.controller';
import * as Minio from 'minio';

@Global()
@Module({
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
    FileService,
  ],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
