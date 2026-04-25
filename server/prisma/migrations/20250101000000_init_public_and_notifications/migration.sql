-- Initial public schema: platform users, tenants, roles, audit logs, notifications.
-- Tenant business tables and the "tenant" template schema are applied in
-- 20260413000000_enable_multischema.
-- Source: prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
--   (public + notifications slice only; tenant template comes from the follow-up migration).

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tenant";

-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(20),
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "roles" TEXT NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "password_changed_at" TIMESTAMP(3),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "department" VARCHAR(100),
    "job_title" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "gender" VARCHAR(10),
    "birth_date" TIMESTAMP(3),
    "id_number" VARCHAR(50),
    "id_number_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "political_status" VARCHAR(20),
    "hukou_location" VARCHAR(200),
    "work_experience" VARCHAR(100),
    "photo_id" UUID,
    "education" VARCHAR(50),
    "major" VARCHAR(100),
    "graduate_year" INTEGER,
    "university" VARCHAR(200),
    "current_company" VARCHAR(200),
    "current_position" VARCHAR(100),
    "emergency_contact" VARCHAR(100),
    "emergency_phone" VARCHAR(20),
    "address" VARCHAR(300),
    "custom_fields" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "schema_name" VARCHAR(63) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "contact_email" VARCHAR(100) NOT NULL,
    "contact_phone" VARCHAR(20),
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "activated_at" TIMESTAMP(3),
    "deactivated_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_tenant_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" UUID,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_tenant_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "security_audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "username" VARCHAR(100),
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100),
    "resource_id" VARCHAR(100),
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "related_id" UUID,
    "related_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_code_key" ON "tenants"("code");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_schema_name_key" ON "tenants"("schema_name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_tenant_roles_user_id_tenant_id_role_key" ON "user_tenant_roles"("user_id", "tenant_id", "role");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "security_audit_logs_action_idx" ON "security_audit_logs"("action");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "security_audit_logs_user_id_idx" ON "security_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "security_audit_logs_created_at_idx" ON "security_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_user_id_status_idx" ON "notifications"("user_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("created_at");

-- AddForeignKey (idempotent: skip if constraint already present)
DO $c$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_tenant_roles_user_id_fkey') THEN
    ALTER TABLE "user_tenant_roles" ADD CONSTRAINT "user_tenant_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_tenant_roles_tenant_id_fkey') THEN
    ALTER TABLE "user_tenant_roles" ADD CONSTRAINT "user_tenant_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$c$;
