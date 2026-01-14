import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static readonly als = new AsyncLocalStorage<{ schema: string }>();

  constructor() {
    const url = process.env.DATABASE_URL || '';
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
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
  }

  /**
   * Run a callback with a specific schema context.
   */
  static runInTenantContext<T>(schema: string, callback: () => T): T {
    return this.als.run({ schema }, callback);
  }

  /**
   * Get the current schema from AsyncLocalStorage.
   */
  static getTenantSchema(): string | undefined {
    return this.als.getStore()?.schema;
  }

  /**
   * Dynamic extension to set search_path before mỗi query.
   */
  get client() {
    const schema = PrismaService.getTenantSchema() || 'public';
    const self = this;

    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            return await PrismaService.als.run({ schema }, async () => {
              // We use a transaction to ensure SET LOCAL is applied correctly to the current connection
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              return await self.$transaction(
                async (tx: Prisma.TransactionClient) => {
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
    });
  }
}
