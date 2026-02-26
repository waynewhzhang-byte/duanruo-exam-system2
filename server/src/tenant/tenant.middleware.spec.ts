import { TenantMiddleware } from './tenant.middleware';
import { PrismaService } from '../prisma/prisma.service';
import { Cache } from 'cache-manager';

describe('TenantMiddleware', () => {
  it('should be defined', () => {
    const mockPrismaService = {} as PrismaService;
    const mockCacheManager = {} as Cache;
    expect(new TenantMiddleware(mockPrismaService, mockCacheManager)).toBeDefined();
  });
});
