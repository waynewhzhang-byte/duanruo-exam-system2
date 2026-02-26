import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as Minio from 'minio';

export const MINIO_CLIENT = 'MINIO_CLIENT';

@Injectable()
export class FileCleanupService {
  private readonly logger = new Logger(FileCleanupService.name);
  private readonly UPLOAD_TIMEOUT_HOURS = 1;

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private getTenantBucketName(tenantCode: string): string {
    const sanitizedCode = tenantCode.toLowerCase().replace(/_/g, '-');
    return `tenant-${sanitizedCode}-files`;
  }

  /**
   * 清理超时的 UPLOADING 状态记录 (每 15 分钟执行一次)
   * 删除超过 1 小时未确认的上传记录及其 MinIO 文件
   */
  @Cron('0 */15 * * * *')
  async cleanupTimeoutUploads() {
    this.logger.debug('[FileCleanup] Starting timeout cleanup...');

    const timeoutThreshold = new Date(
      Date.now() - this.UPLOAD_TIMEOUT_HOURS * 60 * 60 * 1000,
    );

    const timeoutFiles = await this.prisma.publicClient.fileRecord.findMany({
      where: {
        status: 'UPLOADING',
        createdAt: { lt: timeoutThreshold },
      },
    });

    if (timeoutFiles.length === 0) {
      this.logger.debug('[FileCleanup] No timeout files found');
      return;
    }

    this.logger.log(`[FileCleanup] Found ${timeoutFiles.length} timeout files`);

    const tenants = await this.prisma.publicClient.tenant.findMany({
      where: { status: 'ACTIVE' },
    });

    for (const file of timeoutFiles) {
      try {
        const tenant = tenants.find((t) => t.id === file.uploadedBy);
        
        const minioClient = new Minio.Client({
          endPoint: process.env.MINIO_ENDPOINT || 'localhost',
          port: parseInt(process.env.MINIO_PORT || '9000'),
          useSSL: process.env.MINIO_USE_SSL === 'true',
          accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
        });

        const bucketName = this.getTenantBucketName(tenant?.code || 'demo');

        try {
          await minioClient.removeObject(bucketName, file.objectKey);
          this.logger.log(`[FileCleanup] Deleted MinIO object: ${file.objectKey}`);
        } catch (e) {
          this.logger.warn(`[FileCleanup] Failed to delete MinIO object: ${file.objectKey}`);
        }

        await this.prisma.publicClient.fileRecord.update({
          where: { id: file.id },
          data: { status: 'EXPIRED' },
        });

        this.logger.log(`[FileCleanup] Marked file as EXPIRED: ${file.id}`);
      } catch (error) {
        this.logger.error(
          `[FileCleanup] Error processing file ${file.id}: ${(error as Error).message}`,
        );
      }
    }
  }

  /**
   * 自动确认已上传但未确认的文件 (每 5 分钟执行一次)
   * 检查 MinIO 中文件是否存在，如果存在则自动确认
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoConfirmUploads() {
    this.logger.debug('[FileAutoConfirm] Starting auto-confirm scan...');

    const pendingFiles = await this.prisma.publicClient.fileRecord.findMany({
      where: { status: 'UPLOADING' },
    });

    if (pendingFiles.length === 0) {
      this.logger.debug('[FileAutoConfirm] No pending files found');
      return;
    }

    this.logger.log(`[FileAutoConfirm] Found ${pendingFiles.length} pending files`);

    const tenants = await this.prisma.publicClient.tenant.findMany({
      where: { status: 'ACTIVE' },
    });

    const minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });

    for (const file of pendingFiles) {
      try {
        const tenant = tenants.find((t) => t.id === file.uploadedBy);
        const bucketName = this.getTenantBucketName(tenant?.code || 'demo');

        const stats = await minioClient.statObject(bucketName, file.objectKey);

        await this.prisma.publicClient.fileRecord.update({
          where: { id: file.id },
          data: {
            status: 'UPLOADED',
            fileSize: BigInt(stats.size),
          },
        });

        this.logger.log(`[FileAutoConfirm] Auto-confirmed file: ${file.id}`);
      } catch (e) {
        if ((e as { code?: string }).code === 'NotFound') {
          this.logger.debug(`[FileAutoConfirm] File not in MinIO: ${file.objectKey}`);
        } else {
          this.logger.warn(
            `[FileAutoConfirm] Error checking file ${file.id}: ${(e as Error).message}`,
          );
        }
      }
    }
  }
}
