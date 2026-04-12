import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantBucketService } from './tenant-bucket.service';
import { getErrorMessage, getErrorStack } from '../common/utils/error.util';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

let cachedSchemaSql: string | null = null;

/**
 * Resolve init-tables.sql. Nest compiles to dist/src/* so __dirname/../../prisma
 * points at dist/prisma (wrong). Prefer process.cwd() when server is started from repo server/.
 */
function resolveInitTablesSqlPath(): string {
  const candidates = [
    join(process.cwd(), 'prisma', 'tenant-schema', 'init-tables.sql'),
    join(__dirname, '../../../prisma/tenant-schema/init-tables.sql'),
    join(__dirname, '../../prisma/tenant-schema/init-tables.sql'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new InternalServerErrorException(
    `init-tables.sql not found. Tried: ${candidates.join(' | ')}`,
  );
}

function getTenantSchemaSql(): string {
  if (cachedSchemaSql) return cachedSchemaSql;
  const sqlPath = resolveInitTablesSqlPath();
  cachedSchemaSql = readFileSync(sqlPath, 'utf-8');
  return cachedSchemaSql;
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantBucketService: TenantBucketService,
  ) {}

  async createTenant(data: {
    id: string;
    name: string;
    code: string;
    schemaName: string;
    contactEmail: string;
  }) {
    const uuidSchema = await this.resolveUuidExtensionSchema();

    // 1. Create tenant record + schema in transaction (DDL in tx can cause connection issues)
    let tenant;
    try {
      tenant = await this.prisma.$transaction(async (tx) => {
        const t = await tx.tenant.create({
          data: {
            id: data.id,
            name: data.name,
            code: data.code,
            schemaName: data.schemaName,
            contactEmail: data.contactEmail,
            status: 'ACTIVE',
          },
        });
        await tx.$executeRawUnsafe(
          `CREATE SCHEMA IF NOT EXISTS "${data.schemaName}"`,
        );
        return t;
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const meta = e.meta as { target?: string[] };
        const fields = meta?.target?.join(', ') ?? '';
        throw new ConflictException(
          fields.includes('code')
            ? '租户标识（code）已存在，请使用其他标识'
            : `记录冲突：${fields || '唯一约束'}`,
        );
      }
      throw e;
    }

    // 2. Initialize schema tables OUTSIDE transaction - Prisma tx + DDL can fail
    try {
      await this.initializeTenantSchemaStandalone(data.schemaName, uuidSchema);
    } catch (e) {
      await this.compensateFailedTenantInit(tenant.id, data.schemaName);
      throw e;
    }

    // 3. Create MinIO bucket
    await this.createTenantStorage(data.code);

    this.logger.log(`Tenant schema initialized: ${data.schemaName}`);
    return tenant;
  }

  /** Remove DB row + schema if DDL/init failed so retries do not hit unique(code). */
  private async compensateFailedTenantInit(
    tenantId: string,
    schemaName: string,
  ): Promise<void> {
    this.logger.warn(
      `Rolling back tenant after failed schema init: ${tenantId} schema=${schemaName}`,
    );
    try {
      await this.prisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schemaName.replace(/"/g, '""')}" CASCADE`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to DROP SCHEMA ${schemaName}`,
        getErrorStack(err),
      );
    }
    try {
      await this.prisma.tenant.delete({ where: { id: tenantId } });
    } catch (err) {
      this.logger.error(
        `Failed to delete tenant ${tenantId} after rollback`,
        getErrorStack(err),
      );
    }
  }

  /** Resolve schema where uuid-ossp is installed. Run outside transaction to avoid connection/tx issues. */
  private async resolveUuidExtensionSchema(): Promise<string> {
    const rows = await this.prisma.$queryRawUnsafe<
      { nspname: string }[]
    >(`SELECT n.nspname::text as nspname FROM pg_extension e
       JOIN pg_namespace n ON e.extnamespace = n.oid
       WHERE e.extname = 'uuid-ossp' LIMIT 1`);
    const schema = rows[0]?.nspname ?? 'public';
    this.logger.log(`[Tenant] uuid-ossp found in schema: ${schema}`);
    return schema;
  }

  /**
   * Create MinIO bucket for tenant
   * Called after database transaction succeeds
   */
  private async createTenantStorage(tenantCode: string): Promise<void> {
    try {
      await this.tenantBucketService.createTenantBucket(tenantCode);
      this.logger.log(
        `Successfully created storage bucket for tenant: ${tenantCode}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create storage bucket for tenant ${tenantCode}, but tenant creation succeeded. Bucket can be created manually.`,
        getErrorStack(error),
      );
    }
  }

  /**
   * Initialize tenant schema with all required tables.
   * Runs OUTSIDE Prisma transaction - DDL in tx can cause connection/abort issues.
   */
  private async initializeTenantSchemaStandalone(
    schemaName: string,
    uuidSchema: string,
  ) {
    try {
      this.logger.log(
        `Initializing schema: ${schemaName} (uuid from ${uuidSchema})`,
      );

      const qualified = this.qualifySchemaInSql(
        getTenantSchemaSql(),
        schemaName,
        uuidSchema,
      );

      const rawStatements = qualified.split(';');
      let stmtCount = 0;

      for (const statement of rawStatements) {
        const trimmed = statement.trim();
        if (trimmed.length > 2) {
          if (trimmed.toUpperCase().includes('CREATE EXTENSION')) continue;

          const strippedForCheck = this.stripLeadingComments(trimmed);
          if (!strippedForCheck) continue;

          const firstWord = strippedForCheck.split(/\s+/)[0].toUpperCase();
          if (
            firstWord === 'CREATE' ||
            firstWord === 'ALTER' ||
            firstWord === 'DROP' ||
            firstWord === 'INSERT' ||
            firstWord === 'UPDATE' ||
            firstWord === 'DELETE' ||
            firstWord === 'SET' ||
            firstWord === 'GRANT' ||
            firstWord === 'REVOKE'
          ) {
            if (strippedForCheck.toUpperCase().includes('CREATE TABLE')) {
              this.logger.log(
                `Creating TABLE: ${strippedForCheck.substring(0, 60)}...`,
              );
            }
            try {
              await this.prisma.$executeRawUnsafe(trimmed);
              stmtCount++;
            } catch (error) {
              const msg = (error as Error).message;
              this.logger.error(
                `Schema init statement failed: ${trimmed.substring(0, 80)}... Error: ${msg}`,
              );
              throw new InternalServerErrorException(
                `Tenant schema init failed: ${msg}`,
              );
            }
          }
        }
      }

      this.logger.log(`Executed ${stmtCount} SQL statements`);

      await this.verifySchemaInitializationStandalone(schemaName);

      this.logger.log(`Schema initialization completed: ${schemaName}`);
    } catch (error) {
      this.logger.error(
        `Failed to create schema ${schemaName}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException(
        `Failed to initialize schema ${schemaName}: ${getErrorMessage(error)}`,
      );
    }
  }

  private stripLeadingComments(sql: string): string {
    let result = sql;

    while (true) {
      result = result.trimStart();
      if (result.startsWith('--')) {
        const newlineIndex = result.indexOf('\n');
        if (newlineIndex === -1) {
          return '';
        }
        result = result.substring(newlineIndex + 1);
      } else if (result.startsWith('/*')) {
        const endIndex = result.indexOf('*/');
        if (endIndex === -1) {
          return '';
        }
        result = result.substring(endIndex + 2);
      } else {
        break;
      }
    }

    return result.trimStart();
  }

  /**
   * Qualify table names and uuid_generate_v4 with schema prefix so DDL works without relying on search_path.
   * Prisma connection pooling may not preserve SET search_path across queries.
   */
  private qualifySchemaInSql(
    sql: string,
    schemaName: string,
    uuidSchema: string,
  ): string {
    const quoted = `"${schemaName}".`;
    const uuidFn = `"${uuidSchema}".uuid_generate_v4`;
    let out = sql.replace(/\buuid_generate_v4\s*\(\s*\)/g, `${uuidFn}()`);
    const tables = [
      'application_audit_logs',
      'ticket_number_rules',
      'ticket_sequences',
      'seat_assignments',
      'allocation_batches',
      'exam_reviewers',
      'exam_scores',
      'exam_admins',
      'applications',
      'review_tasks',
      'positions',
      'subjects',
      'exams',
      'reviews',
      'payment_orders',
      'tickets',
      'venues',
      'rooms',
      'files',
    ];
    for (const t of tables) {
      out = out.replace(
        new RegExp(`CREATE TABLE IF NOT EXISTS \\b${t}\\b `, 'gi'),
        `CREATE TABLE IF NOT EXISTS ${quoted}${t} `,
      );
      out = out.replace(
        new RegExp(`ON \\b${t}\\b\\(`, 'gi'),
        `ON ${quoted}${t}(`,
      );
      out = out.replace(
        new RegExp(`REFERENCES \\b${t}\\b\\(`, 'gi'),
        `REFERENCES ${quoted}${t}(`,
      );
    }
    return out;
  }

  /** Verify that critical tables exist (standalone - no tx) */
  private async verifySchemaInitializationStandalone(
    schemaName: string,
  ): Promise<void> {
    // Must match tables created in prisma/tenant-schema/init-tables.sql
    const criticalTables = [
      'exams',
      'positions',
      'subjects',
      'applications',
      'application_audit_logs',
      'review_tasks',
      'reviews',
      'exam_reviewers',
      'payment_orders',
      'tickets',
      'ticket_number_rules',
      'ticket_sequences',
      'venues',
      'rooms',
      'seat_assignments',
      'allocation_batches',
      'files',
    ];

    const safeSchema = schemaName.replace(/'/g, "''");
    for (const tableName of criticalTables) {
      const result = await this.prisma.$queryRawUnsafe<{ exists: boolean }[]>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = '${safeSchema}'
          AND table_name = '${tableName}'
        ) as exists`,
      );

      if (!result[0]?.exists) {
        throw new Error(
          `Critical table '${tableName}' not found in schema '${schemaName}'`,
        );
      }
    }

    this.logger.debug(
      `All ${criticalTables.length} critical tables verified in ${schemaName}`,
    );
  }

  async findAll() {
    return this.prisma.tenant.findMany();
  }
}
