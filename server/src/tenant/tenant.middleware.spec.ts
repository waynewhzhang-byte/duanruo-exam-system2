import { TenantMiddleware } from './tenant.middleware';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import type { Request, Response } from 'express';

/** Minimal request shape used by TenantMiddleware + tests reading tenantSchema */
type TenantTestRequest = Request & { tenantSchema?: string };

function createMockRequest(
  overrides: Record<string, unknown> = {},
): TenantTestRequest {
  return {
    path: '/api/exams',
    headers: {},
    ...overrides,
  } as unknown as TenantTestRequest;
}

function createMockResponse(): Response {
  return {} as unknown as Response;
}

function createMockNext() {
  return jest.fn();
}

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let mockPrismaService: {
    tenant: { findFirst: jest.Mock };
    $queryRawUnsafe: jest.Mock;
  };
  let mockCacheManager: { get: jest.Mock; set: jest.Mock };
  let runInTenantContextSpy: jest.SpyInstance;

  beforeEach(() => {
    runInTenantContextSpy = jest
      .spyOn(PrismaService, 'runInTenantContext')
      .mockImplementation((_schema: string, cb: () => unknown) => cb());

    mockPrismaService = {
      tenant: { findFirst: jest.fn() },
      $queryRawUnsafe: jest.fn(),
    };

    mockCacheManager = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    middleware = new TenantMiddleware(
      mockPrismaService as unknown as PrismaService,
      mockCacheManager as unknown as Cache,
    );
  });

  afterEach(() => {
    runInTenantContextSpy.mockRestore();
  });

  describe('public routes', () => {
    it('should use public schema for /auth/ routes without tenant headers', async () => {
      const req = createMockRequest({ path: '/auth/login' });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(runInTenantContextSpy).toHaveBeenCalledWith(
        'public',
        expect.any(Function),
      );
      expect(next).toHaveBeenCalled();
    });

    it('should use public schema for /public/ routes without tenant headers', async () => {
      const req = createMockRequest({ path: '/public/exams/open' });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(runInTenantContextSpy).toHaveBeenCalledWith(
        'public',
        expect.any(Function),
      );
      expect(next).toHaveBeenCalled();
    });

    it('should use public schema for /tenants route', async () => {
      const req = createMockRequest({ path: '/tenants' });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(runInTenantContextSpy).toHaveBeenCalledWith(
        'public',
        expect.any(Function),
      );
    });

    it('should use public schema for /tenants/ sub-paths', async () => {
      const req = createMockRequest({ path: '/tenants/some-tenant' });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(runInTenantContextSpy).toHaveBeenCalledWith(
        'public',
        expect.any(Function),
      );
    });

    it('should use public schema for /health', async () => {
      const req = createMockRequest({ path: '/health' });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(runInTenantContextSpy).toHaveBeenCalledWith(
        'public',
        expect.any(Function),
      );
    });

    it('should use public schema for root path /', async () => {
      const req = createMockRequest({ path: '/' });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(runInTenantContextSpy).toHaveBeenCalledWith(
        'public',
        expect.any(Function),
      );
    });

    it('should reject non-public routes when no tenant headers are provided', async () => {
      const req = createMockRequest({ path: '/api/exams', headers: {} });
      const res = createMockResponse();
      const next = createMockNext();

      await expect(middleware.use(req, res, next)).rejects.toThrow(
        'Tenant context is required for this route',
      );
    });

    it('should use public schema for super-admin routes even if X-Tenant-ID is set', async () => {
      const req = createMockRequest({
        path: '/api/v1/super-admin/users',
        headers: { 'x-tenant-id': '00000000-0000-0000-0000-000000000099' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(mockPrismaService.tenant.findFirst).not.toHaveBeenCalled();
      expect(runInTenantContextSpy).toHaveBeenCalledWith(
        'public',
        expect.any(Function),
      );
    });
  });

  describe('tenant resolution by slug', () => {
    it('should resolve schema by tenant slug', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        schemaName: 'tenant_test',
      });
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ exists: true }]);

      const req = createMockRequest({
        headers: { 'x-tenant-slug': 'test-tenant' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(mockPrismaService.tenant.findFirst).toHaveBeenCalledWith({
        where: { code: 'test-tenant' },
        select: { schemaName: true },
      });
      expect(req.tenantSchema).toBe('tenant_test');
      expect(runInTenantContextSpy).toHaveBeenCalledWith(
        'tenant_test',
        expect.any(Function),
      );
    });
  });

  describe('tenant resolution by id', () => {
    it('should resolve schema by tenant id when no slug provided', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        schemaName: 'tenant_abc',
      });
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ exists: true }]);

      const req = createMockRequest({
        headers: { 'x-tenant-id': 'abc-123' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(mockPrismaService.tenant.findFirst).toHaveBeenCalledWith({
        where: { id: 'abc-123' },
        select: { schemaName: true },
      });
      expect(req.tenantSchema).toBe('tenant_abc');
    });
  });

  describe('slug takes precedence over id', () => {
    it('should prefer slug when both slug and id headers are present', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        schemaName: 'tenant_slug',
      });
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ exists: true }]);

      const req = createMockRequest({
        headers: {
          'x-tenant-slug': 'preferred-slug',
          'x-tenant-id': 'some-id',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(mockPrismaService.tenant.findFirst).toHaveBeenCalledWith({
        where: { code: 'preferred-slug' },
        select: { schemaName: true },
      });
    });
  });

  describe('caching', () => {
    it('should use cached schema when available', async () => {
      mockCacheManager.get.mockResolvedValue('tenant_cached');

      const req = createMockRequest({
        headers: { 'x-tenant-id': 'cached-id' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(req.tenantSchema).toBe('tenant_cached');
      expect(mockPrismaService.tenant.findFirst).not.toHaveBeenCalled();
      expect(runInTenantContextSpy).toHaveBeenCalledWith(
        'tenant_cached',
        expect.any(Function),
      );
    });

    it('should cache resolved schema for 30 minutes', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        schemaName: 'tenant_new',
      });
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ exists: true }]);

      const req = createMockRequest({
        headers: { 'x-tenant-slug': 'new-tenant' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('new-tenant'),
        'tenant_new',
        1800 * 1000,
      );
    });
  });

  describe('error handling', () => {
    it('should throw NotFoundException when tenant not found by slug', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(null);

      const req = createMockRequest({
        headers: { 'x-tenant-slug': 'nonexistent' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await expect(middleware.use(req, res, next)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when tenant not found by id', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(null);

      const req = createMockRequest({
        headers: { 'x-tenant-id': 'nonexistent-id' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await expect(middleware.use(req, res, next)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when tenant schema missing exams table', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        schemaName: 'tenant_incomplete',
      });
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ exists: false }]);

      const req = createMockRequest({
        headers: { 'x-tenant-slug': 'incomplete' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await expect(middleware.use(req, res, next)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should skip exams table check for public schema', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        schemaName: 'public',
      });

      const req = createMockRequest({
        headers: { 'x-tenant-slug': 'public-slug' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(mockPrismaService.$queryRawUnsafe).not.toHaveBeenCalled();
      expect(req.tenantSchema).toBe('public');
    });
  });

  describe('header trimming', () => {
    it('should trim whitespace from x-tenant-id header', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        schemaName: 'tenant_trimmed',
      });
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ exists: true }]);

      const req = createMockRequest({
        headers: { 'x-tenant-id': '  trimmed-id  ' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(mockPrismaService.tenant.findFirst).toHaveBeenCalledWith({
        where: { id: 'trimmed-id' },
        select: { schemaName: true },
      });
    });

    it('should trim whitespace from x-tenant-slug header', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        schemaName: 'tenant_trimmed',
      });
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ exists: true }]);

      const req = createMockRequest({
        headers: { 'x-tenant-slug': '  trimmed-slug  ' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware.use(req, res, next);

      expect(mockPrismaService.tenant.findFirst).toHaveBeenCalledWith({
        where: { code: 'trimmed-slug' },
        select: { schemaName: true },
      });
    });
  });
});
