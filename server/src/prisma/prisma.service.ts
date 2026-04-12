import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

type TenantExtendedClient = PrismaClient;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static readonly als = new AsyncLocalStorage<{ schema: string }>();
  private static readonly extendedClients = new Map<
    string,
    TenantExtendedClient
  >();

  constructor() {
    super({
      log: ['info', 'warn', 'error'],
    });
    // PrismaClient + TS subclass: `client` / `publicClient` / `baseClient` can become own
    // properties with value `undefined`, shadowing getters and breaking `this.prisma.client.exam`.
    // Re-bind them to the full Prisma API (this) via closure — Prisma's internal `this.client`
    // uses a different `this` in getters, so we must not use `get client() { return this; }` alone.
    const self = this as PrismaService & PrismaClient;
    for (const key of ['client', 'publicClient', 'baseClient'] as const) {
      if (Object.prototype.hasOwnProperty.call(self, key)) {
        Reflect.deleteProperty(self, key);
      }
      Object.defineProperty(self, key, {
        configurable: true,
        enumerable: false,
        get(): TenantExtendedClient {
          return self;
        },
      });
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    PrismaService.extendedClients.clear();
  }

  static runInTenantContext<T>(schema: string, callback: () => T): T {
    return this.als.run({ schema }, callback);
  }

  static getTenantSchema(): string | undefined {
    return this.als.getStore()?.schema;
  }

  /** Use {@link PrismaService} instance after constructor fix; prefer `this.prisma` in new code. */
  declare client: TenantExtendedClient;
  declare publicClient: TenantExtendedClient;
  declare baseClient: PrismaClient;
}
