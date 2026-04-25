import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const TEMPLATE_SCHEMA = 'tenant';

function escapeIdentifier(id: string): string {
  return id.replace(/"/g, '""');
}

@Injectable()
export class TenantSchemaMigrationService implements OnModuleInit {
  private readonly logger = new Logger(TenantSchemaMigrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const autoSync = process.env.TENANT_SCHEMA_AUTO_SYNC !== 'false';
    if (!autoSync) {
      this.logger.log(
        'Tenant schema auto-sync disabled (TENANT_SCHEMA_AUTO_SYNC=false)',
      );
      return;
    }

    try {
      await PrismaService.runInTenantContext(TEMPLATE_SCHEMA, () =>
        this.syncAllTenantSchemas(),
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync tenant schemas on startup: ${(error as Error).message}`,
      );
    }
  }

  async syncAllTenantSchemas(): Promise<void> {
    return PrismaService.runInTenantContext(TEMPLATE_SCHEMA, async () => {
      const tenants = await this.prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
      });

      this.logger.log(
        `Syncing ${tenants.length} tenant schemas from template "${TEMPLATE_SCHEMA}"`,
      );

      for (const tenant of tenants) {
        try {
          await this.syncTenantSchema(tenant.schemaName);
        } catch (error) {
          this.logger.error(
            `Failed to sync schema for tenant ${tenant.code} (${tenant.schemaName}): ${(error as Error).message}`,
          );
        }
      }

      this.logger.log('Tenant schema sync completed');
    });
  }

  async syncTenantSchema(schemaName: string): Promise<{
    tablesAdded: number;
    columnsAdded: number;
    indexesAdded: number;
  }> {
    let tablesAdded = 0;
    let columnsAdded = 0;
    let indexesAdded = 0;

    const templateTables = await this.prisma.$queryRaw<
      { tablename: string }[]
    >`SELECT tablename::text AS tablename FROM pg_tables WHERE schemaname = ${TEMPLATE_SCHEMA} ORDER BY tablename`;

    const targetTables = await this.prisma.$queryRaw<
      { tablename: string }[]
    >`SELECT tablename::text AS tablename FROM pg_tables WHERE schemaname = ${schemaName} ORDER BY tablename`;

    const targetTableSet = new Set(targetTables.map((t) => t.tablename));

    const safeSchema = escapeIdentifier(schemaName);

    for (const { tablename } of templateTables) {
      const safeTable = escapeIdentifier(tablename);

      if (!targetTableSet.has(tablename)) {
        await this.prisma
          .$executeRaw`CREATE TABLE IF NOT EXISTS ${Prisma.raw(`"${safeSchema}"."${safeTable}"`)} (LIKE ${Prisma.raw(`"${TEMPLATE_SCHEMA}"."${safeTable}"`)} INCLUDING ALL)`;
        tablesAdded++;
        this.logger.debug(`Added table: ${schemaName}.${tablename}`);
      } else {
        const columnsAddedCount = await this.syncTableColumns(
          schemaName,
          tablename,
        );
        columnsAdded += columnsAddedCount;

        const indexesAddedCount = await this.syncTableIndexes(
          schemaName,
          tablename,
        );
        indexesAdded += indexesAddedCount;
      }
    }

    const templateSequences = await this.prisma.$queryRaw<
      { sequencename: string }[]
    >`SELECT sequencename::text AS sequencename FROM pg_sequences WHERE schemaname = ${TEMPLATE_SCHEMA}`;
    for (const { sequencename } of templateSequences) {
      const safeSeq = escapeIdentifier(sequencename);
      await this.prisma
        .$executeRaw`CREATE SEQUENCE IF NOT EXISTS ${Prisma.raw(`"${safeSchema}"."${safeSeq}"`)}`;
    }

    if (tablesAdded > 0 || columnsAdded > 0) {
      this.logger.log(
        `Synced ${schemaName}: +${tablesAdded} tables, +${columnsAdded} columns, +${indexesAdded} indexes`,
      );
    }

    return { tablesAdded, columnsAdded, indexesAdded };
  }

  private async syncTableColumns(
    schemaName: string,
    tableName: string,
  ): Promise<number> {
    let added = 0;

    const templateColumns = await this.prisma.$queryRaw<
      {
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
        character_maximum_length: number | null;
      }[]
    >`SELECT column_name::text AS column_name, data_type::text AS data_type, is_nullable::text AS is_nullable, column_default::text AS column_default, character_maximum_length FROM information_schema.columns WHERE table_schema = ${TEMPLATE_SCHEMA} AND table_name = ${tableName} ORDER BY ordinal_position`;

    const targetColumns = await this.prisma.$queryRaw<
      { column_name: string }[]
    >`SELECT column_name::text AS column_name FROM information_schema.columns WHERE table_schema = ${schemaName} AND table_name = ${tableName}`;

    const targetColumnSet = new Set(targetColumns.map((c) => c.column_name));
    const safeSchema = escapeIdentifier(schemaName);
    const safeTable = escapeIdentifier(tableName);

    for (const col of templateColumns) {
      if (!targetColumnSet.has(col.column_name)) {
        const safeCol = escapeIdentifier(col.column_name);
        const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
        const defaultStr = col.column_default
          ? ` DEFAULT ${col.column_default}`
          : '';
        const typeStr = col.character_maximum_length
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;

        await this.prisma
          .$executeRaw`ALTER TABLE ${Prisma.raw(`"${safeSchema}"."${safeTable}"`)} ADD COLUMN IF NOT EXISTS ${Prisma.raw(`"${safeCol}"`)} ${Prisma.raw(typeStr + nullable + defaultStr)}`;
        added++;
      }
    }

    return added;
  }

  private async syncTableIndexes(
    schemaName: string,
    tableName: string,
  ): Promise<number> {
    let added = 0;

    const templateIndexes = await this.prisma.$queryRaw<
      { indexname: string; indexdef: string }[]
    >`SELECT indexname::text AS indexname, indexdef FROM pg_indexes WHERE schemaname = ${TEMPLATE_SCHEMA} AND tablename = ${tableName}`;

    const targetIndexes = await this.prisma.$queryRaw<
      { indexname: string }[]
    >`SELECT indexname::text AS indexname FROM pg_indexes WHERE schemaname = ${schemaName} AND tablename = ${tableName}`;

    const targetIndexSet = new Set(targetIndexes.map((i) => i.indexname));

    for (const { indexname, indexdef } of templateIndexes) {
      if (!targetIndexSet.has(indexname)) {
        const targetDef = indexdef
          .replace(
            `"${TEMPLATE_SCHEMA}".`,
            `"${escapeIdentifier(schemaName)}".`,
          )
          .replace(`"${TEMPLATE_SCHEMA}"`, `"${escapeIdentifier(schemaName)}"`);
        // Use IF NOT EXISTS to avoid 42P07 errors when index already exists
        const safeDef = targetDef.replace(
          /CREATE\s+(UNIQUE\s+)?INDEX\s+/,
          'CREATE $1INDEX IF NOT EXISTS ',
        );
        try {
          await this.prisma.$executeRawUnsafe(safeDef);
          added++;
        } catch {
          // Race condition or other transient failure
        }
      }
    }

    return added;
  }
}
