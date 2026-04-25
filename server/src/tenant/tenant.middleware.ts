import {
  Injectable,
  NestMiddleware,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Tenant context comes exclusively from X-Tenant-ID and X-Tenant-Slug headers.
    // The frontend middleware (middleware.ts) extracts tenantSlug from the URL path
    // and tenantId from the JWT payload, then sends them as headers.
    // Sign verification is handled by JwtAuthGuard — we only resolve the schema here.
    const tenantId = (req.headers['x-tenant-id'] as string)?.trim();
    const tenantSlug = (req.headers['x-tenant-slug'] as string)?.trim();

    const path = req.path || '';

    const isPublicRoute =
      path.startsWith('/auth/') ||
      path.startsWith('/public/') ||
      path === '/tenants' ||
      path.startsWith('/tenants/') ||
      path === '/health' ||
      path === '/';

    if (isPublicRoute) {
      return PrismaService.runInTenantContext('public', () => next());
    }

    if (!tenantId && !tenantSlug) {
      throw new BadRequestException(
        'Tenant context is required for this route. Please provide X-Tenant-ID or X-Tenant-Slug header.',
      );
    }

    // 超管接口只操作 public 库表；忽略浏览器误带的 X-Tenant-ID，避免 Prisma 进入租户 schema 后写入 users 失败
    if (path.includes('/super-admin')) {
      return PrismaService.runInTenantContext('public', () => next());
    }

    const cacheKey = `tenant_schema:${tenantSlug || 'none'}:${tenantId || 'none'}`;
    let schemaName = await this.cacheManager.get<string>(cacheKey);

    if (!schemaName) {
      try {
        // Slug takes precedence — URL is user's explicit navigation target
        const tenant = await this.prisma.tenant.findFirst({
          where: tenantSlug
            ? { code: tenantSlug }
            : tenantId
              ? { id: tenantId }
              : { id: 'impossible' },
          select: { schemaName: true },
        });

        if (!tenant) {
          throw new NotFoundException(
            `Tenant not found (id=${tenantId || 'n/a'}, slug=${tenantSlug || 'n/a'})`,
          );
        }

        schemaName = tenant.schemaName;
        // Cache for 30 minutes
        await this.cacheManager.set(cacheKey, schemaName, 1800 * 1000);

        // For non-public schemas, verify the exams table exists to prevent
        // falling back to the public schema and leaking cross-tenant data.
        if (schemaName !== 'public' && schemaName.startsWith('tenant_')) {
          const [row] = await this.prisma.$queryRawUnsafe<
            { exists: boolean }[]
          >(
            `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'exams') as exists`,
            schemaName,
          );
          if (!row?.exists) {
            this.logger.warn(
              `[Tenant] schema ${schemaName} missing exams table — rejecting to prevent data leak`,
            );
            throw new NotFoundException(
              `Tenant schema not properly initialized (missing exams table)`,
            );
          }
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        this.logger.error(
          `Error resolving tenant schema: ${(error as Error).message}`,
        );
        throw error;
      }
    }

    (req as Request & { tenantSchema?: string }).tenantSchema = schemaName;
    PrismaService.runInTenantContext(schemaName, () => next());
  }
}
