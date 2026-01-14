import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantBucketService } from './tenant-bucket.service';
import type { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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
    return await this.prisma.$transaction(async (tx) => {
      // 1. Create tenant record in public schema
      const tenant = await tx.tenant.create({
        data: {
          id: data.id,
          name: data.name,
          code: data.code,
          schemaName: data.schemaName,
          contactEmail: data.contactEmail,
          status: 'ACTIVE',
        },
      });

      // 2. Create the physical schema (PostgreSQL)
      // We use raw query because CREATE SCHEMA is DDL
      await tx.$executeRawUnsafe(
        `CREATE SCHEMA IF NOT EXISTS "${data.schemaName}"`,
      );

      // 3. Initialize the schema tables
      // In a real automated setup, you might run 'prisma db push' or raw DDL scripts here.
      // For now, we will assume the tables exist or provide a way to sync them.
      await this.initializeTenantSchema(tx, data.schemaName);

      // 4. Create dedicated MinIO bucket for tenant
      // Note: This is outside the DB transaction but we handle errors appropriately
      await this.createTenantStorage(data.code);

      return tenant;
    });
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
      // Log error but don't fail the entire tenant creation
      // The bucket can be created manually later if needed
      this.logger.error(
        `Failed to create storage bucket for tenant ${tenantCode}, but tenant creation succeeded. Bucket can be created manually.`,
        error.stack,
      );
      // Optionally: You might want to throw here if bucket creation is critical
      // throw error;
    }
  }

  /**
   * Initialize tenant schema with all required tables
   * Executes SQL template to create tables, indexes, and constraints
   */
  private async initializeTenantSchema(
    tx: Prisma.TransactionClient,
    schemaName: string,
  ) {
    try {
      this.logger.log(`Initializing schema: ${schemaName}`);

      // Read SQL template file
      const templatePath = path.join(
        __dirname,
        'tenant-schema-template.sql',
      );

      if (!fs.existsSync(templatePath)) {
        throw new Error(
          `SQL template file not found at: ${templatePath}`,
        );
      }

      const sqlTemplate = fs.readFileSync(templatePath, 'utf-8');

      // Set search_path to target the new schema
      await tx.$executeRawUnsafe(
        `SET search_path TO "${schemaName}", public`,
      );

      // Execute the SQL template
      // Split by semicolons to execute each statement separately
      const statements = sqlTemplate
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.length > 0) {
          await tx.$executeRawUnsafe(statement);
        }
      }

      this.logger.log(
        `Successfully initialized schema: ${schemaName} with ${statements.length} statements`,
      );

      // Verify critical tables were created
      await this.verifySchemaInitialization(tx, schemaName);

      this.logger.log(`Schema verification passed: ${schemaName}`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize schema: ${schemaName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to initialize schema ${schemaName}: ${error.message}`,
      );
    }
  }

  /**
   * Verify that critical tables exist in the schema
   */
  private async verifySchemaInitialization(
    tx: Prisma.TransactionClient,
    schemaName: string,
  ): Promise<void> {
    const criticalTables = [
      'exams',
      'positions',
      'subjects',
      'applications',
      'review_tasks',
      'reviews',
      'tickets',
      'payment_orders',
    ];

    for (const tableName of criticalTables) {
      const result = await tx.$queryRawUnsafe<{ exists: boolean }[]>(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = $1
          AND table_name = $2
        ) as exists
      `,
        schemaName,
        tableName,
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
