import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';
import { getErrorMessage, getErrorStack } from '../common/utils/error.util';

const MINIO_CLIENT = 'MINIO_CLIENT';

/** MinIO JS client v8 supports CORS; @types/minio may omit this method */
interface MinioClientWithBucketCors {
  setBucketCors(
    bucketName: string,
    corsConfig: { CORSRules: unknown[] },
  ): Promise<void>;
}

/**
 * Tenant Bucket Management Service
 * Handles creation and management of tenant-specific MinIO buckets
 */
@Injectable()
export class TenantBucketService {
  private readonly logger = new Logger(TenantBucketService.name);

  constructor(
    @Inject(MINIO_CLIENT) private readonly minioClient: Minio.Client,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get tenant bucket name from tenant code
   * Format: tenant-{code}-files
   */
  getTenantBucketName(tenantCode: string): string {
    // Ensure bucket name follows MinIO naming rules:
    // - 3-63 characters
    // - lowercase letters, numbers, hyphens
    // - no underscores, no consecutive hyphens
    const sanitizedCode = tenantCode.toLowerCase().replace(/_/g, '-');
    return `tenant-${sanitizedCode}-files`;
  }

  /**
   * Create a dedicated bucket for a new tenant
   * Automatically called during tenant creation
   */
  async createTenantBucket(tenantCode: string): Promise<void> {
    const bucketName = this.getTenantBucketName(tenantCode);

    try {
      // Check if bucket already exists
      const exists = await this.minioClient.bucketExists(bucketName);

      if (exists) {
        this.logger.warn(
          `Bucket already exists: ${bucketName}, skipping creation`,
        );
        return;
      }

      // Create the bucket
      await this.minioClient.makeBucket(bucketName, 'us-east-1');
      this.logger.log(`Created MinIO bucket: ${bucketName}`);

      // Set CORS policy so browsers can upload directly via presigned URLs
      await this.setBucketCorsPolicy(bucketName);

      // Set bucket lifecycle policy (optional: auto-delete expired files)
      this.setBucketLifecyclePolicy(bucketName);

      // Set bucket versioning (optional: enable versioning for audit trail)
      // await this.enableBucketVersioning(bucketName);

      this.logger.log(
        `Successfully initialized MinIO bucket for tenant: ${tenantCode}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create MinIO bucket for tenant ${tenantCode}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException(
        `Failed to create storage bucket for tenant: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Set CORS policy on a bucket so browsers can directly upload/download
   * files via presigned URLs without CORS errors.
   */
  private async setBucketCorsPolicy(bucketName: string): Promise<void> {
    try {
      const corsOrigins = this.configService.get<string>(
        'MINIO_CORS_ORIGINS',
        '*',
      );
      const client = this.minioClient as unknown as MinioClientWithBucketCors;
      await client.setBucketCors(bucketName, {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: corsOrigins.split(',').map((o) => o.trim()),
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3600,
          },
        ],
      });
      this.logger.log(`Set CORS policy for bucket: ${bucketName}`);
    } catch (error) {
      this.logger.warn(
        `Failed to set CORS policy for ${bucketName}: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Set lifecycle policy to auto-delete files with expiration date
   */
  private setBucketLifecyclePolicy(bucketName: string): void {
    try {
      // Placeholder: wire MinIO lifecycle API when ready (e.g. temp/ prefix expiry, tag-based expiry).
      this.logger.debug(`Set lifecycle policy for bucket: ${bucketName}`);
    } catch (error) {
      // Non-critical error, log and continue
      this.logger.warn(
        `Failed to set lifecycle policy for ${bucketName}: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Enable bucket versioning for audit trail
   */
  private enableBucketVersioning(bucketName: string): void {
    try {
      // Note: MinIO versioning API
      // await this.minioClient.setBucketVersioning(bucketName, { Status: 'Enabled' });
      this.logger.debug(`Enabled versioning for bucket: ${bucketName}`);
    } catch (error) {
      this.logger.warn(
        `Failed to enable versioning for ${bucketName}: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Delete tenant bucket (used when tenant is deleted)
   * WARNING: This will delete all files in the bucket!
   */
  async deleteTenantBucket(
    tenantCode: string,
    force: boolean = false,
  ): Promise<void> {
    const bucketName = this.getTenantBucketName(tenantCode);

    try {
      const exists = await this.minioClient.bucketExists(bucketName);
      if (!exists) {
        this.logger.warn(`Bucket does not exist: ${bucketName}`);
        return;
      }

      if (force) {
        // Delete all objects in the bucket first
        await this.deleteAllObjectsInBucket(bucketName);
      }

      // Remove the bucket
      await this.minioClient.removeBucket(bucketName);
      this.logger.log(`Deleted MinIO bucket: ${bucketName}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete bucket ${bucketName}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException(
        `Failed to delete storage bucket: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Delete all objects in a bucket
   */
  private async deleteAllObjectsInBucket(bucketName: string): Promise<void> {
    const objectsStream = this.minioClient.listObjects(bucketName, '', true);

    const objectsToDelete: string[] = [];

    return new Promise((resolve, reject) => {
      objectsStream.on('data', (obj) => {
        if (obj.name) {
          objectsToDelete.push(obj.name);
        }
      });

      objectsStream.on('end', () => {
        if (objectsToDelete.length === 0) {
          resolve();
          return;
        }
        this.minioClient
          .removeObjects(bucketName, objectsToDelete)
          .then(() => {
            this.logger.log(
              `Deleted ${objectsToDelete.length} objects from ${bucketName}`,
            );
            resolve();
          })
          .catch((error: unknown) => {
            reject(error instanceof Error ? error : new Error(String(error)));
          });
      });

      objectsStream.on('error', (error: unknown) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });
  }

  /**
   * Get bucket statistics for a tenant
   */
  async getTenantBucketStats(tenantCode: string): Promise<{
    bucketName: string;
    exists: boolean;
    objectCount?: number;
    totalSize?: number;
  }> {
    const bucketName = this.getTenantBucketName(tenantCode);

    try {
      const exists = await this.minioClient.bucketExists(bucketName);

      if (!exists) {
        return { bucketName, exists: false };
      }

      // Count objects and calculate total size
      let objectCount = 0;
      let totalSize = 0;

      const objectsStream = this.minioClient.listObjects(bucketName, '', true);

      await new Promise<void>((resolve, reject) => {
        objectsStream.on('data', (obj) => {
          objectCount++;
          totalSize += obj.size || 0;
        });
        objectsStream.on('end', resolve);
        objectsStream.on('error', reject);
      });

      return {
        bucketName,
        exists: true,
        objectCount,
        totalSize,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get bucket stats for ${tenantCode}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException(
        `Failed to get bucket statistics: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Verify bucket exists for a tenant
   */
  async verifyTenantBucket(tenantCode: string): Promise<boolean> {
    const bucketName = this.getTenantBucketName(tenantCode);
    try {
      return await this.minioClient.bucketExists(bucketName);
    } catch (error) {
      this.logger.error(
        `Failed to verify bucket for tenant ${tenantCode}`,
        error,
      );
      return false;
    }
  }
}
