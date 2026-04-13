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

const TEMPLATE_SCHEMA = 'tenant';

const CRITICAL_TABLES = [
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
  'exam_scores',
] as const;

function escapeIdentifier(id: string): string {
  return id.replace(/"/g, '""');
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
        await tx.$executeRaw`CREATE SCHEMA IF NOT EXISTS ${Prisma.raw(`"${escapeIdentifier(data.schemaName)}"`)}`;
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

    try {
      await this.cloneSchemaFromTemplate(data.schemaName);
    } catch (e) {
      await this.compensateFailedTenantInit(tenant.id, data.schemaName);
      throw e;
    }

    await this.createTenantStorage(data.code);

    this.logger.log(`Tenant schema initialized: ${data.schemaName}`);
    return tenant;
  }

  private async compensateFailedTenantInit(
    tenantId: string,
    schemaName: string,
  ): Promise<void> {
    this.logger.warn(
      `Rolling back tenant after failed schema init: ${tenantId} schema=${schemaName}`,
    );
    try {
      await this.prisma
        .$executeRaw`DROP SCHEMA IF EXISTS ${Prisma.raw(`"${escapeIdentifier(schemaName)}"`)} CASCADE`;
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
   * Clone all tables from the "tenant" template schema into the target tenant schema.
   * The template schema is maintained by Prisma migrations and always has the latest
   * table structure. Each new tenant gets a LIKE ... INCLUDING ALL copy.
   */
  private async cloneSchemaFromTemplate(targetSchema: string): Promise<void> {
    const safeSchema = escapeIdentifier(targetSchema);

    try {
      const templateTables = await this.prisma.$queryRaw<
        { tablename: string }[]
      >`SELECT tablename FROM pg_tables WHERE schemaname = ${TEMPLATE_SCHEMA} ORDER BY tablename`;

      if (templateTables.length === 0) {
        throw new InternalServerErrorException(
          `Template schema "${TEMPLATE_SCHEMA}" is empty. Run Prisma migrations first to populate it.`,
        );
      }

      for (const { tablename } of templateTables) {
        const safeTable = escapeIdentifier(tablename);
        await this.prisma
          .$executeRaw`CREATE TABLE IF NOT EXISTS ${Prisma.raw(`"${safeSchema}"."${safeTable}"`)} (LIKE ${Prisma.raw(`"${TEMPLATE_SCHEMA}"."${safeTable}"`)} INCLUDING ALL)`;
        this.logger.debug(`Cloned table: ${targetSchema}.${tablename}`);
      }

      const templateSequences = await this.prisma.$queryRaw<
        { sequencename: string }[]
      >`SELECT sequencename FROM pg_sequences WHERE schemaname = ${TEMPLATE_SCHEMA}`;

      for (const { sequencename } of templateSequences) {
        const safeSeq = escapeIdentifier(sequencename);
        await this.prisma
          .$executeRaw`CREATE SEQUENCE IF NOT EXISTS ${Prisma.raw(`"${safeSchema}"."${safeSeq}"`)}`;
      }

      await this.verifySchemaInitialization(targetSchema);

      this.logger.log(
        `Cloned ${templateTables.length} tables from "${TEMPLATE_SCHEMA}" to "${targetSchema}"`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to clone schema from template: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException(
        `Failed to initialize tenant schema ${targetSchema}: ${getErrorMessage(error)}`,
      );
    }
  }

  private async verifySchemaInitialization(schemaName: string): Promise<void> {
    for (const tableName of CRITICAL_TABLES) {
      const result = await this.prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = ${schemaName}
          AND table_name = ${tableName}
        ) as exists`;

      if (!result[0]?.exists) {
        throw new Error(
          `Critical table '${tableName}' not found in schema '${schemaName}'`,
        );
      }
    }

    this.logger.debug(
      `All ${CRITICAL_TABLES.length} critical tables verified in ${schemaName}`,
    );
  }

  async findAll() {
    return this.prisma.tenant.findMany();
  }
}
