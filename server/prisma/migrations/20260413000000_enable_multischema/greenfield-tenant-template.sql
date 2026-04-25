-- Snapshot of tenant-only DDL for the greenfield branch in migration.sql.
-- Regenerate from server/: 
--   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
-- Then copy the blocks for: all CREATE TABLE "tenant".*, related CREATE INDEX, ADD CONSTRAINT for "tenant".*
-- (see PR / scripts that maintain this file — keep in sync with prisma/schema.prisma).

CREATE TABLE "tenant"."exams" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "announcement" TEXT,
    "registration_start" TIMESTAMP(3),
    "registration_end" TIMESTAMP(3),
    "exam_start" TIMESTAMP(3),
    "exam_end" TIMESTAMP(3),
    "fee_required" BOOLEAN NOT NULL DEFAULT false,
    "fee_amount" DECIMAL(10,2),
    "ticket_template" TEXT,
    "form_template" JSONB,
    "form_template_id" UUID,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."positions" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "quota" INTEGER,
    "rules_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."subjects" (
    "id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "max_score" DECIMAL(5,2),
    "passing_score" DECIMAL(5,2),
    "weight" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "schedule" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."applications" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "form_version" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "total_written_score" DECIMAL(6,2),
    "written_pass_score" DECIMAL(5,2),
    "written_pass_status" TEXT,
    "interview_eligibility" TEXT,
    "final_result" TEXT,
    "interview_time" TIMESTAMP(3),
    "interview_location" VARCHAR(255),
    "interview_room" VARCHAR(100),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."application_audit_logs" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "from_status" VARCHAR(50),
    "to_status" VARCHAR(50) NOT NULL,
    "actor" VARCHAR(100),
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."review_tasks" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "stage" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "assigned_to" UUID,
    "locked_at" TIMESTAMP(3),
    "last_heartbeat_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."reviews" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "stage" VARCHAR(50) NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "decision" VARCHAR(50),
    "comment" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."exam_reviewers" (
    "id" BIGSERIAL NOT NULL,
    "exam_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "stage" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_reviewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."payment_orders" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "out_trade_no" VARCHAR(64) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "transaction_id" VARCHAR(128),
    "payment_params" TEXT,
    "callback_data" TEXT,
    "failure_reason" VARCHAR(500),
    "paid_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."tickets" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "ticket_no" VARCHAR(100) NOT NULL,
    "ticket_number" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "candidate_name" VARCHAR(500),
    "candidate_id_number" VARCHAR(500),
    "candidate_photo" VARCHAR(500),
    "exam_title" VARCHAR(200),
    "position_title" VARCHAR(200),
    "exam_start_time" TIMESTAMP(3),
    "exam_end_time" TIMESTAMP(3),
    "venue_name" VARCHAR(200),
    "room_number" VARCHAR(50),
    "seat_number" VARCHAR(50),
    "qr_code" TEXT,
    "barcode" VARCHAR(100),
    "issued_at" TIMESTAMP(3) NOT NULL,
    "printed_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."seat_assignments" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "room_id" UUID,
    "seat_no" INTEGER NOT NULL,
    "seat_label" VARCHAR(100),
    "batch_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seat_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."ticket_number_rules" (
    "exam_id" UUID NOT NULL,
    "custom_prefix" VARCHAR(50),
    "include_exam_code" BOOLEAN NOT NULL,
    "include_exam_name" BOOLEAN NOT NULL,
    "include_position_code" BOOLEAN NOT NULL,
    "include_position_name" BOOLEAN NOT NULL,
    "date_format" VARCHAR(20) NOT NULL,
    "sequence_length" INTEGER NOT NULL,
    "sequence_start" INTEGER NOT NULL,
    "daily_reset" BOOLEAN NOT NULL,
    "checksum_type" VARCHAR(20) NOT NULL,
    "separator" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_number_rules_pkey" PRIMARY KEY ("exam_id")
);

-- CreateTable
CREATE TABLE "tenant"."ticket_sequences" (
    "exam_id" UUID NOT NULL,
    "scope" VARCHAR(16) NOT NULL,
    "counter_date" DATE NOT NULL,
    "current_value" BIGINT NOT NULL,

    CONSTRAINT "ticket_sequences_pkey" PRIMARY KEY ("exam_id","scope","counter_date")
);

-- CreateTable
CREATE TABLE "tenant"."venues" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "seat_map_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."rooms" (
    "id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "floor" INTEGER,
    "description" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."allocation_batches" (
    "id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "strategy" TEXT,
    "total_candidates" INTEGER NOT NULL,
    "total_assigned" INTEGER NOT NULL,
    "total_venues" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "allocation_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."files" (
    "id" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "stored_name" VARCHAR(255) NOT NULL,
    "object_key" VARCHAR(255) NOT NULL,
    "content_type" VARCHAR(100),
    "file_size" BIGINT,
    "field_key" VARCHAR(100),
    "application_id" UUID,
    "uploaded_by" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'UPLOADING',
    "virus_scan_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "virus_scan_result" TEXT,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "last_accessed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant"."exam_scores" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "exam_id" UUID NOT NULL,
    "position_id" UUID NOT NULL,
    "score" DECIMAL(5,2),
    "is_absent" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "interview_eligibility" TEXT,
    "interview_score" DECIMAL(5,2),
    "final_result" TEXT,
    "recorded_by" UUID,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "exams_code_key" ON "tenant"."exams"("code");

-- CreateIndex
CREATE UNIQUE INDEX "positions_exam_id_code_key" ON "tenant"."positions"("exam_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "applications_exam_id_candidate_id_key" ON "tenant"."applications"("exam_id", "candidate_id");

-- CreateIndex
CREATE INDEX "review_tasks_application_id_stage_idx" ON "tenant"."review_tasks"("application_id", "stage");

-- CreateIndex
CREATE INDEX "review_tasks_assigned_to_status_idx" ON "tenant"."review_tasks"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "reviews_application_id_idx" ON "tenant"."reviews"("application_id");

-- CreateIndex
CREATE INDEX "reviews_reviewer_id_idx" ON "tenant"."reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "reviews_stage_idx" ON "tenant"."reviews"("stage");

-- CreateIndex
CREATE INDEX "reviews_decision_idx" ON "tenant"."reviews"("decision");

-- CreateIndex
CREATE INDEX "reviews_reviewed_at_idx" ON "tenant"."reviews"("reviewed_at");

-- CreateIndex
CREATE INDEX "exam_reviewers_exam_id_idx" ON "tenant"."exam_reviewers"("exam_id");

-- CreateIndex
CREATE INDEX "exam_reviewers_reviewer_id_idx" ON "tenant"."exam_reviewers"("reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_reviewers_exam_id_reviewer_id_stage_key" ON "tenant"."exam_reviewers"("exam_id", "reviewer_id", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_out_trade_no_key" ON "tenant"."payment_orders"("out_trade_no");

-- CreateIndex
CREATE INDEX "payment_orders_application_id_idx" ON "tenant"."payment_orders"("application_id");

-- CreateIndex
CREATE INDEX "payment_orders_transaction_id_idx" ON "tenant"."payment_orders"("transaction_id");

-- CreateIndex
CREATE INDEX "payment_orders_status_idx" ON "tenant"."payment_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_no_key" ON "tenant"."tickets"("ticket_no");

-- CreateIndex
CREATE UNIQUE INDEX "seat_assignments_application_id_key" ON "tenant"."seat_assignments"("application_id");

-- CreateIndex
CREATE INDEX "seat_assignments_exam_id_idx" ON "tenant"."seat_assignments"("exam_id");

-- CreateIndex
CREATE INDEX "seat_assignments_batch_id_idx" ON "tenant"."seat_assignments"("batch_id");

-- CreateIndex
CREATE INDEX "venues_exam_id_idx" ON "tenant"."venues"("exam_id");

-- CreateIndex
CREATE INDEX "rooms_venue_id_idx" ON "tenant"."rooms"("venue_id");

-- CreateIndex
CREATE INDEX "allocation_batches_exam_id_idx" ON "tenant"."allocation_batches"("exam_id");

-- CreateIndex
CREATE UNIQUE INDEX "files_stored_name_key" ON "tenant"."files"("stored_name");

-- CreateIndex
CREATE UNIQUE INDEX "files_object_key_key" ON "tenant"."files"("object_key");

-- CreateIndex
CREATE INDEX "exam_scores_exam_id_idx" ON "tenant"."exam_scores"("exam_id");

-- CreateIndex
CREATE INDEX "exam_scores_candidate_id_idx" ON "tenant"."exam_scores"("candidate_id");

-- CreateIndex
CREATE INDEX "exam_scores_interview_eligibility_idx" ON "tenant"."exam_scores"("interview_eligibility");

-- CreateIndex
CREATE UNIQUE INDEX "exam_scores_application_id_subject_id_key" ON "tenant"."exam_scores"("application_id", "subject_id");

ALTER TABLE "tenant"."positions" ADD CONSTRAINT "positions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "tenant"."exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."subjects" ADD CONSTRAINT "subjects_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "tenant"."positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."applications" ADD CONSTRAINT "applications_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "tenant"."exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."applications" ADD CONSTRAINT "applications_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "tenant"."positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."rooms" ADD CONSTRAINT "rooms_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "tenant"."venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."files" ADD CONSTRAINT "files_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "tenant"."applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant"."exam_scores" ADD CONSTRAINT "exam_scores_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "tenant"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

