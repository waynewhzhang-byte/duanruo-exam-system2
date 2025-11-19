-- 验证 Flyway 迁移状态
\echo '=== Flyway Schema History ==='
SELECT version, description, type, installed_on, success 
FROM flyway_schema_history 
WHERE version IN ('010', '011', '012', '013', '014', '015')
ORDER BY installed_rank;

\echo ''
\echo '=== Public Schema - Users Table Encrypted Columns ==='
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name IN ('email', 'full_name', 'phone_number')
ORDER BY column_name;

\echo ''
\echo '=== Public Schema - Tenants Table Encrypted Columns ==='
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tenants' 
  AND column_name IN ('contact_email', 'contact_phone')
ORDER BY column_name;

\echo ''
\echo '=== Tenant Schemas - Tickets Table Encrypted Columns ==='
SELECT 
    n.nspname AS schema_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length
FROM information_schema.columns c
JOIN pg_namespace n ON n.nspname = c.table_schema
WHERE n.nspname LIKE 'tenant_%'
  AND c.table_name = 'tickets'
  AND c.column_name IN ('candidate_name', 'candidate_id_number')
ORDER BY n.nspname, c.column_name;

\echo ''
\echo '=== Performance Indexes (V011) ==='
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname IN ('public', 'tenant_company_a', 'tenant_company_b')
  AND indexname LIKE 'idx_%'
ORDER BY schemaname, tablename, indexname;

\echo ''
\echo '=== Tickets Table Structure (V012) ==='
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tickets'
ORDER BY ordinal_position;

\echo ''
\echo '=== Payment Orders Table Structure (V013) ==='
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payment_orders'
ORDER BY ordinal_position;

