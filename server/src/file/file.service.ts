import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { FileValidator } from './file-validator';
import {
  FileUploadUrlRequest,
  FileUploadUrlResponse,
  PresignedUrlResponse,
  FileBatchInfoResponse,
} from './dto/file.dto';

export const MINIO_CLIENT = 'MINIO_CLIENT';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @Inject(MINIO_CLIENT) private readonly minioClient: Minio.Client,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get tenant-specific bucket name from tenant code
   * Format: tenant-{code}-files
   */
  private getTenantBucketName(tenantCode: string): string {
    const sanitizedCode = tenantCode.toLowerCase().replace(/_/g, '-');
    return `tenant-${sanitizedCode}-files`;
  }

  /**
   * Ensure tenant bucket exists
   * Called before file operations
   */
  private async ensureTenantBucket(tenantCode: string): Promise<string> {
    const bucketName = this.getTenantBucketName(tenantCode);

    try {
      const exists = await this.minioClient.bucketExists(bucketName);
      if (!exists) {
        this.logger.warn(
          `Tenant bucket does not exist: ${bucketName}, creating...`,
        );
        await this.minioClient.makeBucket(bucketName, 'us-east-1');
        this.logger.log(`Created MinIO bucket: ${bucketName}`);
      }
      return bucketName;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to ensure tenant bucket ${bucketName}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException(
        `Storage bucket not available for tenant: ${tenantCode}`,
      );
    }
  }

  async generateUploadUrl(
    tenantId: string,
    userId: string,
    req: FileUploadUrlRequest,
  ): Promise<FileUploadUrlResponse> {
    const { fileName, contentType, fieldKey, applicationId } = req;

    // 1. Get tenant code from tenantId
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { code: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    // 2. Ensure tenant bucket exists
    const bucketName = await this.ensureTenantBucket(tenant.code);

    // 3. Validations
    const nameValid = FileValidator.validateFileName(fileName);
    if (!nameValid.valid) throw new BadRequestException(nameValid.errorMessage);

    const extValid = FileValidator.validateFileExtension(fileName);
    if (!extValid.valid) throw new BadRequestException(extValid.errorMessage);

    const typeValid = FileValidator.validateContentType(contentType, fileName);
    if (!typeValid.valid) throw new BadRequestException(typeValid.errorMessage);

    const fileId = uuidv4();
    const extension = fileName.split('.').pop();
    const storedName = `${fileId}${extension ? '.' + extension : ''}`;

    // Simplified path structure within tenant bucket
    // uploads/{userId}/{fieldKey}/{storedName}
    const objectKey = `uploads/${userId}/${fieldKey || 'general'}/${storedName}`;

    // 4. Create DB record
    await this.prisma.client.fileRecord.create({
      data: {
        id: fileId,
        originalName: fileName,
        storedName: storedName,
        objectKey: objectKey,
        contentType: contentType,
        fieldKey: fieldKey,
        applicationId: applicationId,
        uploadedBy: userId,
        status: 'UPLOADING',
      },
    });

    // 5. Generate Presigned URL
    const expiresIn = parseInt(
      this.configService.get<string>('MINIO_PRESIGN_EXPIRES', '3600'),
    );
    const uploadUrl = await this.minioClient.presignedPutObject(
      bucketName,
      objectKey,
      expiresIn,
    );

    return {
      fileId,
      uploadUrl,
      fileKey: objectKey,
      fileName,
      contentType,
      fieldKey: fieldKey || '',
      expiresIn,
    };
  }

  async confirmUpload(tenantId: string, fileId: string, fileSize: number) {
    const file = await this.prisma.client.fileRecord.findUnique({
      where: { id: fileId },
    });

    if (!file) throw new NotFoundException('File not found');
    if (file.status !== 'UPLOADING')
      throw new BadRequestException('File is not in UPLOADING state');

    // Get tenant code and bucket name
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { code: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const bucketName = this.getTenantBucketName(tenant.code);

    // Verify file exists in Minio
    try {
      await this.minioClient.statObject(bucketName, file.objectKey);
    } catch {
      throw new BadRequestException('File not found in storage');
    }

    // Validation
    const sizeValid = FileValidator.validateFileSize(fileSize);
    if (!sizeValid.valid) {
      await this.minioClient.removeObject(bucketName, file.objectKey);
      await this.prisma.client.fileRecord.update({
        where: { id: fileId },
        data: { status: 'DELETED' },
      });
      throw new BadRequestException(sizeValid.errorMessage);
    }

    // Update DB
    return await this.prisma.client.fileRecord.update({
      where: { id: fileId },
      data: {
        fileSize: BigInt(fileSize),
        status: 'UPLOADED',
      },
    });
  }

  async getDownloadUrl(
    tenantId: string,
    fileId: string,
  ): Promise<PresignedUrlResponse> {
    const file = await this.prisma.client.fileRecord.findUnique({
      where: { id: fileId },
    });

    if (!file) throw new NotFoundException('File not found');
    if (file.status === 'DELETED')
      throw new BadRequestException('File has been deleted');

    // Get tenant code and bucket name
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { code: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const bucketName = this.getTenantBucketName(tenant.code);

    const expiresIn = 1800; // 30 minutes
    const url = await this.minioClient.presignedGetObject(
      bucketName,
      file.objectKey,
      expiresIn,
    );

    // Update access info
    await this.prisma.client.fileRecord.update({
      where: { id: fileId },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    return { url, expiresIn };
  }

  async getBatchFileInfo(fileIds: string[]): Promise<FileBatchInfoResponse> {
    const files = await this.prisma.client.fileRecord.findMany({
      where: { id: { in: fileIds } },
    });

    return {
      files: files.map((f) => ({
        id: f.id,
        originalName: f.originalName,
        storedName: f.storedName,
        objectKey: f.objectKey,
        contentType: f.contentType || '',
        fileSize: Number(f.fileSize || 0),
        status: f.status,
        virusScanStatus: f.virusScanStatus,
        uploadedAt: f.createdAt,
      })),
      total: files.length,
      requestedBy: 'SYSTEM',
      timestamp: new Date(),
    };
  }

  async findById(id: string) {
    return this.prisma.client.fileRecord.findUnique({ where: { id } });
  }
}
