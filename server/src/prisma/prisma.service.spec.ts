import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('client should reference the full Prisma API (not Prisma internal stub)', () => {
    expect(service.client).toBe(service);
    expect(service.client.exam).toBeDefined();
    expect(service.client.tenant).toBeDefined();
  });
});
