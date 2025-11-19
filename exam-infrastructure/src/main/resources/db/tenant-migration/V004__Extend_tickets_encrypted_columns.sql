-- V004 (tenant): Extend tickets encrypted columns to VARCHAR(500) in each tenant schema (idempotent)
-- This migration runs per-tenant schema via SchemaManagementService / Flyway, not from public migration.

DO $$
DECLARE
  sch TEXT := current_schema();
BEGIN
  -- candidate_name -> 500 (if exists and shorter)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = sch AND table_name='tickets'
      AND column_name='candidate_name'
      AND (character_maximum_length IS NULL OR character_maximum_length < 500)
  ) THEN
    EXECUTE format('ALTER TABLE %I.tickets ALTER COLUMN candidate_name TYPE VARCHAR(500)', sch);
    EXECUTE format('COMMENT ON COLUMN %I.tickets.candidate_name IS ''%s''', sch, '考生姓名（AES加密存储）');
  END IF;

  -- candidate_id_number -> 500 (if exists and shorter)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = sch AND table_name='tickets'
      AND column_name='candidate_id_number'
      AND (character_maximum_length IS NULL OR character_maximum_length < 500)
  ) THEN
    EXECUTE format('ALTER TABLE %I.tickets ALTER COLUMN candidate_id_number TYPE VARCHAR(500)', sch);
    EXECUTE format('COMMENT ON COLUMN %I.tickets.candidate_id_number IS ''%s''', sch, '考生身份证号（AES加密存储）');
  END IF;
END $$;

