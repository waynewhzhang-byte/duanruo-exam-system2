import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    const tenantSlug = req.headers['x-tenant-slug'] as string; // Alternative

    if (!tenantId && !tenantSlug) {
      // Default to public schema for global routes
      return PrismaService.runInTenantContext('public', () => next());
    }

    // Lookup schema name by tenantId or slug
    // We use the PrismaService directly here (unextended) to query the public schema
    let schemaName = 'public';
    try {
      const tenant = await this.prisma.tenant.findFirst({
        where: {
          OR: [{ id: tenantId }, { code: tenantSlug }],
        },
      });

      if (tenant) {
        schemaName = tenant.schemaName;
      }
    } catch (error) {
      console.error('Error looking up tenant schema:', error);
    }

    PrismaService.runInTenantContext(schemaName, () => next());
  }
}
