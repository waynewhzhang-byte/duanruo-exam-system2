import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    const tenantSlug = req.headers['x-tenant-slug'] as string; // Alternative

    if (!tenantId && !tenantSlug) {
      // Default to public schema for global routes
      return PrismaService.runInTenantContext('public', () => next());
    }

    // Lookup schema name by tenantId or slug
    const cacheKey = `tenant_schema:${tenantId || 'none'}:${tenantSlug || 'none'}`;
    let schemaName = await this.cacheManager.get<string>(cacheKey);

    if (!schemaName) {
      schemaName = 'public';
      try {
        const tenant = await this.prisma.tenant.findFirst({
          where: {
            OR: [
              ...(tenantId ? [{ id: tenantId }] : []),
              ...(tenantSlug ? [{ code: tenantSlug }] : []),
            ],
          },
          select: { schemaName: true },
        });

        if (tenant) {
          schemaName = tenant.schemaName;
          // Cache for 30 minutes
          await this.cacheManager.set(cacheKey, schemaName, 1800 * 1000);
        }
      } catch (error) {
        console.error('Error looking up tenant schema:', error);
      }
    }

    PrismaService.runInTenantContext(schemaName, () => next());
  }
}
