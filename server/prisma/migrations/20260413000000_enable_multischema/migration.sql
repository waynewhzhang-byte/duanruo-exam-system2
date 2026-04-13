-- =============================================================================
-- Migration: Enable multiSchema with tenant template schema
-- 
-- This migration:
-- 1. Creates the "tenant" template schema
-- 2. Moves all tenant tables from "public" to "tenant" schema
-- 3. Preserves existing data (uses CREATE ... LIKE for structure, 
--    then INSERT ... SELECT for data)
-- 4. Existing tenant_XXX schemas are NOT affected - they remain as-is
-- =============================================================================

-- Step 1: Create the tenant template schema
CREATE SCHEMA IF NOT EXISTS "tenant";

-- Step 2: Move tenant tables from public to tenant schema
-- These tables belong to the "tenant" @@schema in Prisma and must exist
-- in the "tenant" template schema for Prisma multiSchema to work.

-- exams
CREATE TABLE IF NOT EXISTS "tenant".exams (LIKE "public".exams INCLUDING ALL);
INSERT INTO "tenant".exams SELECT * FROM "public".exams WHERE EXISTS (SELECT 1 FROM "public".exams);
DROP TABLE IF EXISTS "public".exams;

-- positions  
CREATE TABLE IF NOT EXISTS "tenant".positions (LIKE "public".positions INCLUDING ALL);
INSERT INTO "tenant".positions SELECT * FROM "public".positions;
DROP TABLE IF EXISTS "public".positions;

-- subjects
CREATE TABLE IF NOT EXISTS "tenant".subjects (LIKE "public".subjects INCLUDING ALL);
INSERT INTO "tenant".subjects SELECT * FROM "public".subjects;
DROP TABLE IF EXISTS "public".subjects;

-- applications
CREATE TABLE IF NOT EXISTS "tenant".applications (LIKE "public".applications INCLUDING ALL);
INSERT INTO "tenant".applications SELECT * FROM "public".applications;
DROP TABLE IF EXISTS "public".applications;

-- application_audit_logs
CREATE TABLE IF NOT EXISTS "tenant".application_audit_logs (LIKE "public".application_audit_logs INCLUDING ALL);
INSERT INTO "tenant".application_audit_logs SELECT * FROM "public".application_audit_logs;
DROP TABLE IF EXISTS "public".application_audit_logs;

-- review_tasks
CREATE TABLE IF NOT EXISTS "tenant".review_tasks (LIKE "public".review_tasks INCLUDING ALL);
INSERT INTO "tenant".review_tasks SELECT * FROM "public".review_tasks;
DROP TABLE IF EXISTS "public".review_tasks;

-- reviews
CREATE TABLE IF NOT EXISTS "tenant".reviews (LIKE "public".reviews INCLUDING ALL);
INSERT INTO "tenant".reviews SELECT * FROM "public".reviews;
DROP TABLE IF EXISTS "public".reviews;

-- exam_reviewers
CREATE TABLE IF NOT EXISTS "tenant".exam_reviewers (LIKE "public".exam_reviewers INCLUDING ALL);
INSERT INTO "tenant".exam_reviewers SELECT * FROM "public".exam_reviewers;
DROP TABLE IF EXISTS "public".exam_reviewers;

-- payment_orders
CREATE TABLE IF NOT EXISTS "tenant".payment_orders (LIKE "public".payment_orders INCLUDING ALL);
INSERT INTO "tenant".payment_orders SELECT * FROM "public".payment_orders;
DROP TABLE IF EXISTS "public".payment_orders;

-- tickets
CREATE TABLE IF NOT EXISTS "tenant".tickets (LIKE "public".tickets INCLUDING ALL);
INSERT INTO "tenant".tickets SELECT * FROM "public".tickets;
DROP TABLE IF EXISTS "public".tickets;

-- ticket_number_rules
CREATE TABLE IF NOT EXISTS "tenant".ticket_number_rules (LIKE "public".ticket_number_rules INCLUDING ALL);
INSERT INTO "tenant".ticket_number_rules SELECT * FROM "public".ticket_number_rules;
DROP TABLE IF EXISTS "public".ticket_number_rules;

-- ticket_sequences
CREATE TABLE IF NOT EXISTS "tenant".ticket_sequences (LIKE "public".ticket_sequences INCLUDING ALL);
INSERT INTO "tenant".ticket_sequences SELECT * FROM "public".ticket_sequences;
DROP TABLE IF EXISTS "public".ticket_sequences;

-- venues
CREATE TABLE IF NOT EXISTS "tenant".venues (LIKE "public".venues INCLUDING ALL);
INSERT INTO "tenant".venues SELECT * FROM "public".venues;
DROP TABLE IF EXISTS "public".venues;

-- rooms
CREATE TABLE IF NOT EXISTS "tenant".rooms (LIKE "public".rooms INCLUDING ALL);
INSERT INTO "tenant".rooms SELECT * FROM "public".rooms;
DROP TABLE IF EXISTS "public".rooms;

-- seat_assignments
CREATE TABLE IF NOT EXISTS "tenant".seat_assignments (LIKE "public".seat_assignments INCLUDING ALL);
INSERT INTO "tenant".seat_assignments SELECT * FROM "public".seat_assignments;
DROP TABLE IF EXISTS "public".seat_assignments;

-- allocation_batches
CREATE TABLE IF NOT EXISTS "tenant".allocation_batches (LIKE "public".allocation_batches INCLUDING ALL);
INSERT INTO "tenant".allocation_batches SELECT * FROM "public".allocation_batches;
DROP TABLE IF EXISTS "public".allocation_batches;

-- files
CREATE TABLE IF NOT EXISTS "tenant".files (LIKE "public".files INCLUDING ALL);
INSERT INTO "tenant".files SELECT * FROM "public".files;
DROP TABLE IF EXISTS "public".files;

-- exam_scores
CREATE TABLE IF NOT EXISTS "tenant".exam_scores (LIKE "public".exam_scores INCLUDING ALL);
INSERT INTO "tenant".exam_scores SELECT * FROM "public".exam_scores;
DROP TABLE IF EXISTS "public".exam_scores;

-- Step 3: Verify - public schema should only have public tables
-- Expected remaining tables: users, user_profiles, tenants, user_tenant_roles, 
-- security_audit_logs, notifications