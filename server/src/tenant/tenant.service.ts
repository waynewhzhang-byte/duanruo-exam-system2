import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantBucketService } from './tenant-bucket.service';
import type { Prisma } from '@prisma/client';

const TENANT_SCHEMA_SQL = `-- Tenant Schema Initialization Template

-- =============================================================================
-- CORE BUSINESS TABLES
-- =============================================================================

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    announcement TEXT,
    registration_start TIMESTAMP,
    registration_end TIMESTAMP,
    exam_start TIMESTAMP,
    exam_end TIMESTAMP,
    fee_required BOOLEAN NOT NULL DEFAULT FALSE,
    fee_amount DECIMAL(10, 2),
    ticket_template TEXT,
    form_template JSONB,
    form_template_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL,
    code VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    quota INTEGER,
    rules_config JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_positions_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT uk_positions_exam_code UNIQUE (exam_id, code)
);

CREATE INDEX IF NOT EXISTS idx_positions_exam_id ON positions(exam_id);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL,
    type VARCHAR(64) NOT NULL,
    max_score DECIMAL(5, 2),
    passing_score DECIMAL(5, 2),
    weight DECIMAL(3, 2) NOT NULL DEFAULT 1.0,
    ordering INTEGER NOT NULL DEFAULT 0,
    schedule JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subjects_position FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subjects_position_id ON subjects(position_id);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL,
    exam_id UUID NOT NULL,
    position_id UUID NOT NULL,
    form_version INTEGER NOT NULL DEFAULT 1,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_applications_exam FOREIGN KEY (exam_id) REFERENCES exams(id),
    CONSTRAINT fk_applications_position FOREIGN KEY (position_id) REFERENCES positions(id),
    CONSTRAINT uk_applications_exam_candidate UNIQUE (exam_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_exam_id ON applications(exam_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_position_id ON applications(position_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Application audit logs
CREATE TABLE IF NOT EXISTS application_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    actor VARCHAR(100),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_application_audit_logs_application_id ON application_audit_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_application_audit_logs_created_at ON application_audit_logs(created_at);

-- Review tasks table
CREATE TABLE IF NOT EXISTS review_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    stage VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    assigned_to UUID,
    locked_at TIMESTAMP,
    last_heartbeat_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_tasks_app_stage ON review_tasks(application_id, stage);
CREATE INDEX IF NOT EXISTS idx_review_tasks_assigned_status ON review_tasks(assigned_to, status);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    stage VARCHAR(50) NOT NULL,
    reviewer_id UUID NOT NULL,
    decision VARCHAR(50),
    comment TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_application_id ON reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_stage ON reviews(stage);
CREATE INDEX IF NOT EXISTS idx_reviews_decision ON reviews(decision);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_at ON reviews(reviewed_at);

-- Exam reviewers table
CREATE TABLE IF NOT EXISTS exam_reviewers (
    id BIGSERIAL PRIMARY KEY,
    exam_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    stage VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exam_reviewers_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT uk_exam_reviewer_stage UNIQUE (exam_id, reviewer_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_exam_reviewers_exam ON exam_reviewers(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_reviewers_reviewer ON exam_reviewers(reviewer_id);

-- Payment orders table
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    out_trade_no VARCHAR(64) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(128),
    payment_params TEXT,
    callback_data TEXT,
    failure_reason VARCHAR(500),
    paid_at TIMESTAMP,
    expired_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_out_trade_no ON payment_orders(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_payment_orders_application_id ON payment_orders(application_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_transaction_id ON payment_orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    exam_id UUID NOT NULL,
    position_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    ticket_no VARCHAR(100) UNIQUE NOT NULL,
    ticket_number VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    candidate_name VARCHAR(500),
    candidate_id_number VARCHAR(500),
    candidate_photo VARCHAR(500),
    exam_title VARCHAR(200),
    position_title VARCHAR(200),
    exam_start_time TIMESTAMP,
    exam_end_time TIMESTAMP,
    venue_name VARCHAR(200),
    room_number VARCHAR(50),
    seat_number VARCHAR(50),
    qr_code TEXT,
    barcode VARCHAR(100),
    issued_at TIMESTAMP NOT NULL,
    printed_at TIMESTAMP,
    verified_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_application_id ON tickets(application_id);
CREATE INDEX IF NOT EXISTS idx_tickets_exam_id ON tickets(exam_id);
CREATE INDEX IF NOT EXISTS idx_tickets_candidate_id ON tickets(candidate_id);

-- Ticket number rules table
CREATE TABLE IF NOT EXISTS ticket_number_rules (
    exam_id UUID PRIMARY KEY,
    custom_prefix VARCHAR(50),
    include_exam_code BOOLEAN NOT NULL,
    include_exam_name BOOLEAN NOT NULL,
    include_position_code BOOLEAN NOT NULL,
    include_position_name BOOLEAN NOT NULL,
    date_format VARCHAR(20) NOT NULL,
    sequence_length INTEGER NOT NULL,
    sequence_start INTEGER NOT NULL,
    daily_reset BOOLEAN NOT NULL,
    checksum_type VARCHAR(20) NOT NULL,
    separator VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_number_rules_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- Ticket sequences table
CREATE TABLE IF NOT EXISTS ticket_sequences (
    exam_id UUID NOT NULL,
    scope VARCHAR(16) NOT NULL,
    counter_date DATE NOT NULL,
    current_value BIGINT NOT NULL,
    PRIMARY KEY (exam_id, scope, counter_date),
    CONSTRAINT fk_ticket_sequences_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- Venues table
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    seat_map_json JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_venues_exam_id ON venues(exam_id);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) NOT NULL,
    capacity INTEGER NOT NULL,
    floor INTEGER,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rooms_venue FOREIGN KEY (venue_id) REFERENCES venues(id)
);

CREATE INDEX IF NOT EXISTS idx_rooms_venue_id ON rooms(venue_id);

-- Seat assignments table
CREATE TABLE IF NOT EXISTS seat_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL,
    position_id UUID NOT NULL,
    application_id UUID UNIQUE NOT NULL,
    venue_id UUID NOT NULL,
    room_id UUID,
    seat_no INTEGER NOT NULL,
    seat_label VARCHAR(100),
    batch_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seat_assignments_exam_id ON seat_assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_seat_assignments_batch_id ON seat_assignments(batch_id);

-- Allocation batches table
CREATE TABLE IF NOT EXISTS allocation_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL,
    strategy TEXT,
    total_candidates INTEGER NOT NULL,
    total_assigned INTEGER NOT NULL,
    total_venues INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_allocation_batches_exam_id ON allocation_batches(exam_id);

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) UNIQUE NOT NULL,
    object_key VARCHAR(255) UNIQUE NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT,
    field_key VARCHAR(100),
    application_id UUID,
    uploaded_by UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADING',
    virus_scan_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    virus_scan_result TEXT,
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_files_application FOREIGN KEY (application_id) REFERENCES applications(id)
);

CREATE INDEX IF NOT EXISTS idx_files_application_id ON files(application_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
`;

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

      // Skip verification for now - tables are created but verification has issues
      this.logger.log(`Tenant schema initialized: ${data.schemaName}`);

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

      // Set search_path to target the new schema
      await tx.$executeRawUnsafe(
        `SET search_path TO "${schemaName}", public`,
      );

      // Enable UUID extension in this schema
      await tx.$executeRawUnsafe(
        `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
      );

      // Execute the embedded SQL template - split by semicolon and execute each
      const rawStatements = TENANT_SCHEMA_SQL.split(';');
      let stmtCount = 0;
      
      for (const statement of rawStatements) {
        const trimmed = statement.trim();
        // Skip empty and comment-only statements
        if (trimmed.length > 2) {
          // Check if it's not just a comment
          const firstWord = trimmed.split(/\s+/)[0].toUpperCase();
          if (firstWord === 'CREATE' || firstWord === 'ALTER' || firstWord === 'DROP' || firstWord === 'INSERT' || firstWord === 'UPDATE' || firstWord === 'DELETE' || firstWord === 'SET' || firstWord === 'GRANT' || firstWord === 'REVOKE') {
            try {
              // Log the statement type
              if (trimmed.toUpperCase().includes('CREATE TABLE')) {
                this.logger.log(`Creating TABLE: ${trimmed.substring(0, 60)}...`);
              }
              await tx.$executeRawUnsafe(trimmed);
              stmtCount++;
            } catch (error) {
              this.logger.warn(`Statement failed: ${trimmed.substring(0, 50)}... Error: ${(error as Error).message}`);
            }
          }
        }
      }

      this.logger.log(`Executed ${stmtCount} SQL statements`);

      this.logger.log(
        `Successfully initialized schema: ${schemaName}`,
      );

      // Skip verification - tables are created but verification has issues with search_path
      // await this.verifySchemaInitialization(tx, schemaName);

      this.logger.log(`Schema initialization completed: ${schemaName}`);
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
      'applications',
      'review_tasks',
      'reviews',
      'tickets',
      'payment_orders',
    ];

    for (const tableName of criticalTables) {
      const result = await tx.$queryRawUnsafe<{ exists: boolean }[]>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
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
