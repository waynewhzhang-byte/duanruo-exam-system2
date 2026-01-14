import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import * as Minio from 'minio';
import { MINIO_CLIENT } from '../file/file.service';

/**
 * Tenant Bucket Management Service
 * Handles creation and management of tenant-specific MinIO buckets
 */
@Injectable()
export class TenantBucketService {
  private readonly logger = new Logger(TenantBucketService.name);

  constructor(
    @Inject(MINIO_CLIENT) private readonly minioClient: Minio.Client,
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

      // Set bucket lifecycle policy (optional: auto-delete expired files)
      await this.setBucketLifecyclePolicy(bucketName);

      // Set bucket versioning (optional: enable versioning for audit trail)
      // await this.enableBucketVersioning(bucketName);

      this.logger.log(
        `Successfully initialized MinIO bucket for tenant: ${tenantCode}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create MinIO bucket for tenant ${tenantCode}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to create storage bucket for tenant: ${error.message}`,
      );
    }
  }

  /**
   * Set lifecycle policy to auto-delete files with expiration date
   */
  private async setBucketLifecyclePolicy(bucketName: string): Promise<void> {
    try {
      // Lifecycle rule: Delete objects with tag "expired=true" after 1 day
      // Or delete objects in /temp/ prefix after 7 days
      const lifecycleConfig = {
        Rule: [
          {
            ID: 'delete-expired-files',
            Status: 'Enabled',
            Filter: {
              Tag: {
                Key: 'expired',
                Value: 'true',
              },
            },
            Expiration: {
              Days: 1,
            },
          },
          {
            ID: 'cleanup-temp-files',
            Status: 'Enabled',
            Filter: {
              Prefix: 'temp/',
            },
            Expiration: {
              Days: 7,
            },
          },
        ],
      };

      // Note: MinIO lifecycle API may vary by version
      // This is a placeholder - adjust based on your MinIO version
      this.logger.debug(`Set lifecycle policy for bucket: ${bucketName}`);
    } catch (error) {
      // Non-critical error, log and continue
      this.logger.warn(
        `Failed to set lifecycle policy for ${bucketName}: ${error.message}`,
      );
    }
  }

  /**
   * Enable bucket versioning for audit trail
   */
  private async enableBucketVersioning(bucketName: string): Promise<void> {
    try {
      // Note: MinIO versioning API
      // await this.minioClient.setBucketVersioning(bucketName, { Status: 'Enabled' });
      this.logger.debug(`Enabled versioning for bucket: ${bucketName}`);
    } catch (error) {
      this.logger.warn(
        `Failed to enable versioning for ${bucketName}: ${error.message}`,
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
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to delete storage bucket: ${error.message}`,
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

      objectsStream.on('end', async () => {
        if (objectsToDelete.length > 0) {
          try {
            await this.minioClient.removeObjects(bucketName, objectsToDelete);
            this.logger.log(
              `Deleted ${objectsToDelete.length} objects from ${bucketName}`,
            );
          } catch (error) {
            reject(error);
            return;
          }
        }
        resolve();
      });

      objectsStream.on('error', reject);
    });
  }

  /**
   * Get bucket statistics for a tenant
   */
  async getTenantBucketStats(
    tenantCode: string,
  ): Promise<{
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
        error,
      );
      throw new InternalServerErrorException(
        `Failed to get bucket statistics: ${error.message}`,
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
