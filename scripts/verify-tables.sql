-- 验证租户Schema中的表

\echo '========================================'
\echo '租户Schema中的所有表'
\echo '========================================'

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'tenant_test_company_a' 
ORDER BY table_name;

\echo ''
\echo '========================================'
\echo 'Flyway迁移历史'
\echo '========================================'

SELECT installed_rank, version, description, installed_on, success 
FROM tenant_test_company_a.flyway_schema_history 
ORDER BY installed_rank;

