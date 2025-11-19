-- ============================================
-- 完整的数据库迁移验证脚本
-- ============================================

\echo '=========================================='
\echo '1. Flyway 迁移历史记录'
\echo '=========================================='
SELECT 
    installed_rank,
    version,
    description,
    type,
    script,
    installed_on,
    execution_time,
    success
FROM flyway_schema_history
WHERE version >= '010'
ORDER BY installed_rank;

\echo ''
\echo '=========================================='
\echo '2. V010 - 租户表结构验证'
\echo '=========================================='
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tenants'
ORDER BY ordinal_position;

\echo ''
\echo '=========================================='
\echo '3. V010 - 用户表结构验证'
\echo '=========================================='
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

\echo ''
\echo '=========================================='
\echo '4. V010 - 用户租户角色表结构验证'
\echo '=========================================='
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_tenant_roles'
ORDER BY ordinal_position;

\echo ''
\echo '=========================================='
\echo '5. V011 - 性能索引验证（Public Schema）'
\echo '=========================================='
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo ''
\echo '=========================================='
\echo '6. V011 - 性能索引验证（Tenant Schemas）'
\echo '=========================================='
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname LIKE 'tenant_%'
  AND indexname LIKE 'idx_%'
ORDER BY schemaname, tablename, indexname;

\echo ''
\echo '=========================================='
\echo '7. V012 - Tickets 表结构验证'
\echo '=========================================='
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
ORDER BY ordinal_position;

\echo ''
\echo '=========================================='
\echo '8. V012 - Tickets 表索引验证'
\echo '=========================================='
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'tickets'
ORDER BY indexname;

\echo ''
\echo '=========================================='
\echo '9. V013 - Payment Orders 表结构验证'
\echo '=========================================='
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payment_orders'
ORDER BY ordinal_position;

\echo ''
\echo '=========================================='
\echo '10. V013 - Payment Orders 表索引验证'
\echo '=========================================='
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'payment_orders'
ORDER BY indexname;

\echo ''
\echo '=========================================='
\echo '11. V014 - Ticket Number Rules 表验证'
\echo '=========================================='
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ticket_number_rules'
ORDER BY ordinal_position;

\echo ''
\echo '=========================================='
\echo '12. V015 - 加密字段扩展验证（Users）'
\echo '=========================================='
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as column_comment
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('email', 'full_name', 'phone_number')
ORDER BY column_name;

\echo ''
\echo '=========================================='
\echo '13. V015 - 加密字段扩展验证（Tenants）'
\echo '=========================================='
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as column_comment
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tenants'
  AND column_name IN ('contact_email', 'contact_phone')
ORDER BY column_name;

\echo ''
\echo '=========================================='
\echo '14. V015 - 加密字段扩展验证（Tickets）'
\echo '=========================================='
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as column_comment
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tickets'
  AND column_name IN ('candidate_name', 'candidate_id_number')
ORDER BY column_name;

\echo ''
\echo '=========================================='
\echo '15. 租户 Schema 列表'
\echo '=========================================='
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata
WHERE schema_name LIKE 'tenant_%'
ORDER BY schema_name;

\echo ''
\echo '=========================================='
\echo '16. 租户表数据统计'
\echo '=========================================='
SELECT 
    id,
    name,
    code,
    schema_name,
    status,
    created_at
FROM public.tenants
ORDER BY created_at;

\echo ''
\echo '=========================================='
\echo '17. 关键约束验证'
\echo '=========================================='
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('tenants', 'users', 'user_tenant_roles', 'tickets', 'payment_orders', 'ticket_number_rules')
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

\echo ''
\echo '=========================================='
\echo '18. 迁移成功性总结'
\echo '=========================================='
SELECT 
    COUNT(*) FILTER (WHERE version >= '010' AND success = true) as successful_migrations,
    COUNT(*) FILTER (WHERE version >= '010' AND success = false) as failed_migrations,
    MAX(version) as latest_version,
    MAX(installed_on) as last_migration_time
FROM flyway_schema_history
WHERE version >= '010';

\echo ''
\echo '=========================================='
\echo '验证完成！'
\echo '=========================================='

