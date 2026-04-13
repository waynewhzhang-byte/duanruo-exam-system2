/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AsyncLocalStorage } from 'async_hooks';
import { ConfigService } from '@nestjs/config';
import { createTenantPool, setTenantSchemaGetter } from './tenant-pool.wrapper';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static readonly als = new AsyncLocalStorage<{ schema: string }>();
  private readonly logger = new Logger(PrismaService.name);
  private _publicClient: PrismaClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

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

  get client(): PrismaClient {
    return this;
  }

  /**
   * Returns a PrismaClient that always operates in the `public` schema,
   * bypassing any tenant context set by TenantMiddleware.
   * Uses a Proxy to wrap every method call in runInTenantContext('public').
   */
  get publicClient(): PrismaClient {
    if (!this._publicClient) {
      this._publicClient = new Proxy(this, {
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
    }
    return this._publicClient;
  }
}
