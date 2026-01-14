import { TenantMiddleware } from './tenant.middleware';
import { PrismaService } from '../prisma/prisma.service';

describe('TenantMiddleware', () => {
  it('should be defined', () => {
    const mockPrismaService = {} as PrismaService;
    expect(new TenantMiddleware(mockPrismaService)).toBeDefined();
  });
});
