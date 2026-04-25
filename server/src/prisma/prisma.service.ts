/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AsyncLocalStorage } from 'node:async_hooks';
import { ConfigService } from '@nestjs/config';
import { createTenantPool, setTenantSchemaGetter } from './tenant-pool.wrapper';

function applyPgEnvFromDatabaseUrl(databaseUrl: string): void {
  try {
    const parsed = new URL(databaseUrl);
    const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));

    if (database) {
      process.env.PGDATABASE = database;
    }
    if (parsed.hostname) {
      process.env.PGHOST = parsed.hostname;
    }
    if (parsed.port) {
      process.env.PGPORT = parsed.port;
    }
    if (parsed.username) {
      process.env.PGUSER = decodeURIComponent(parsed.username);
    }
    if (parsed.password) {
      process.env.PGPASSWORD = decodeURIComponent(parsed.password);
    }
  } catch {
    // Ignore parsing errors and let downstream connection validation fail normally.
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static readonly als = new AsyncLocalStorage<{ schema: string }>();
  private readonly logger = new Logger(PrismaService.name);
  private _publicClient: PrismaClient | null = null;

  /**
   * Always reads the `public` schema. Implemented on the instance in the
   * constructor via `defineProperty` because Prisma's engine client with a
   * driver adapter does not keep the subclass prototype chain, so a class
   * getter on `PrismaService` would never run.
   */
  declare public readonly publicClient: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    applyPgEnvFromDatabaseUrl(databaseUrl);

    const tenantPool = createTenantPool(databaseUrl);
    setTenantSchemaGetter(() => PrismaService.getTenantSchema());

    const adapter = new PrismaPg(tenantPool as unknown as import('pg').Pool);

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    // PrismaClient instances expose an own `client` property with `undefined` value.
    // Our services rely on `prisma.client.<model>` access. Redefine the instance
    // property so it returns this PrismaService instance consistently.
    Object.defineProperty(this, 'client', {
      configurable: true,
      enumerable: false,
      get: () => this,
    });

    // PrismaClient can leave an own `publicClient` slot (often `undefined`).
    // Replace it with a getter that returns the public-schema proxy (see class
    // comment on `declare publicClient`).
    delete (this as Record<string, unknown>)['publicClient'];

    Object.defineProperty(this, 'publicClient', {
      configurable: true,
      enumerable: false,
      get: (): PrismaClient => {
        const self = this as PrismaService;
        self._publicClient ??= new Proxy(self, {
          get(target: PrismaService, prop: string | symbol): unknown {
            const value = (target as any)[prop];
            if (typeof value !== 'function') {
              return value;
            }
            return (...args: unknown[]): Promise<unknown> =>
              PrismaService.runInTenantContext('public', () =>
                value.apply(target, args),
              );
          },
        }) as any as PrismaClient;
        return self._publicClient;
      },
    });

    if (process.env.NODE_ENV === 'development') {
      (
        this as unknown as {
          $on: (
            event: string,
            cb: (e: { query: string; duration: number }) => void,
          ) => void;
        }
      ).$on('query', (e: { query: string; duration: number }) => {
        this.logger.debug(`Query: ${e.query} — ${e.duration}ms`);
      });
    }
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('PrismaClient connected with tenant-aware pool adapter');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('PrismaClient disconnected');
  }

  static runInTenantContext<T>(schema: string, callback: () => T): T {
    return this.als.run({ schema }, callback);
  }

  static getTenantSchema(): string | undefined {
    return this.als.getStore()?.schema;
  }

  /**
   * Physical schema used by Prisma `@@schema("tenant")` — the structure template.
   * Business data must not be written here; per-tenant schemas are `tenant_*`.
   */
  static readonly TEMPLATE_SCHEMA_NAME = 'tenant';

  /**
   * Reject mutating operations that would write into the template schema
   * (e.g. missing or invalid X-Tenant-* so ALS stayed on `tenant`).
   */
  static assertNotTemplateSchemaForWrite(operation: string): void {
    const s = this.getTenantSchema();
    if (s === this.TEMPLATE_SCHEMA_NAME) {
      throw new BadRequestException(
        `${operation}: 当前请求解析到模板库 schema "${this.TEMPLATE_SCHEMA_NAME}"，禁止写入业务数据。请携带有效的 X-Tenant-ID 或 X-Tenant-Slug。`,
      );
    }
  }

  get client(): PrismaClient {
    return this;
  }
}
