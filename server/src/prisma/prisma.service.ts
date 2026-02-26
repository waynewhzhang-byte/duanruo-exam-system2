import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

type TenantExtendedClient = PrismaClient;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static readonly als = new AsyncLocalStorage<{ schema: string }>();
  private static readonly extendedClients = new Map<string, TenantExtendedClient>();
  private static pool: Pool | null = null;

  constructor() {
    const url = process.env.DATABASE_URL || '';
    
    if (!PrismaService.pool) {
      PrismaService.pool = new Pool({ connectionString: url });
    }
    
    const adapter = new PrismaPg(PrismaService.pool);
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    if (PrismaService.pool) {
      await PrismaService.pool.end();
      PrismaService.pool = null;
    }
    PrismaService.extendedClients.clear();
  }

  static runInTenantContext<T>(schema: string, callback: () => T): T {
    return this.als.run({ schema }, callback);
  }

  static getTenantSchema(): string | undefined {
    return this.als.getStore()?.schema;
  }

  private createExtendedClient(_schema: string): TenantExtendedClient {
    const self = this;
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            const schema = PrismaService.getTenantSchema() || 'public';
            return await PrismaService.als.run({ schema }, async () => {
              return await self.$transaction(
                async (tx) => {
                  await tx.$executeRawUnsafe(
                    `SET LOCAL search_path TO "${schema}", public`,
                  );
                  return query(args);
                },
              );
            });
          },
        },
      },
    }) as TenantExtendedClient;
  }

  get client(): TenantExtendedClient {
    const schema = PrismaService.getTenantSchema() || 'public';
    
    let extendedClient = PrismaService.extendedClients.get(schema);
    if (!extendedClient) {
      extendedClient = this.createExtendedClient(schema);
      PrismaService.extendedClients.set(schema, extendedClient);
    }
    
    return extendedClient;
  }

  get publicClient(): TenantExtendedClient {
    const schema = 'public';
    
    let extendedClient = PrismaService.extendedClients.get('public');
    if (!extendedClient) {
      extendedClient = this.createExtendedClient(schema);
      PrismaService.extendedClients.set('public', extendedClient);
    }
    
    return extendedClient;
  }

  get baseClient(): PrismaClient {
    return this;
  }
}
