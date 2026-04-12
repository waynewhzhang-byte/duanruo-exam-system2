import { FileService } from './file.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

describe('FileService', () => {
  let service: FileService;

  const mockMinioClient = {
    bucketExists: jest.fn().mockResolvedValue(true),
    presignedPutObject: jest.fn().mockResolvedValue('http://mock-upload-url'),
    presignedGetObject: jest.fn().mockResolvedValue('http://mock-download-url'),
  };

  const mockPrisma = {
    client: {
      tenant: { findUnique: jest.fn().mockResolvedValue({ code: 'demo' }) },
      fileRecord: {
        create: jest.fn().mockResolvedValue({ id: 'f1' }),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    },
  };

  beforeEach(() => {
    service = new FileService(
      mockMinioClient as unknown as Client,
      new ConfigService(),
      mockPrisma as unknown as PrismaService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
