import { Test, TestingModule } from '@nestjs/testing';
import { FileService, MINIO_CLIENT } from './file.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

describe('FileService', () => {
  let service: FileService;

  const mockMinioClient = {
    bucketExists: jest.fn().mockResolvedValue(true),
    makeBucket: jest.fn().mockResolvedValue(true),
    presignedPutObject: jest.fn().mockResolvedValue('http://mock-upload-url'),
    presignedGetObject: jest.fn().mockResolvedValue('http://mock-download-url'),
    statObject: jest.fn().mockResolvedValue({ size: 1024 }),
    removeObject: jest.fn().mockResolvedValue(true),
  };

  const mockPrisma = {
    client: {
      fileRecord: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        {
          provide: MINIO_CLIENT,
          useValue: mockMinioClient,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateUploadUrl', () => {
    it('should generate a presigned upload URL and create a record', async () => {
      const tenantId = 'tenant-1';
      const userId = 'user-1';
      const req = {
        fileName: 'test.pdf',
        contentType: 'application/pdf',
        fieldKey: 'resume',
      };

      const result: { uploadUrl: string } = await service.generateUploadUrl(
        tenantId,
        userId,
        req,
      );

      expect(result.uploadUrl).toBe('http://mock-upload-url');
      expect(mockPrisma.client.fileRecord.create).toHaveBeenCalled();
      expect(mockMinioClient.presignedPutObject).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid file name', async () => {
      const req = {
        fileName: 'invalid/file.pdf',
        contentType: 'application/pdf',
      };

      await expect(service.generateUploadUrl('t1', 'u1', req)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('confirmUpload', () => {
    it('should update status to UPLOADED if validation passes', async () => {
      const fileId = 'file-1';
      const tenantId = 't1';
      mockPrisma.client.fileRecord.findUnique.mockResolvedValue({
        id: fileId,
        status: 'UPLOADING',
        objectKey: 'tenants/t1/uploads/u1/k1/f1.pdf',
      });

      await service.confirmUpload(tenantId, fileId, 1024);

      expect(mockPrisma.client.fileRecord.update).toHaveBeenCalledWith({
        where: { id: fileId },
        data: {
          fileSize: BigInt(1024),
          status: 'UPLOADED',
        },
      });
    });

    it('should throw error if file belongs to another tenant', async () => {
      mockPrisma.client.fileRecord.findUnique.mockResolvedValue({
        id: 'f1',
        status: 'UPLOADING',
        objectKey: 'tenants/other-tenant/uploads/u1/k1/f1.pdf',
      });

      await expect(
        service.confirmUpload('my-tenant', 'f1', 1024),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
