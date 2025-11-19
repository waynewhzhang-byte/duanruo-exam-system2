-- ========================================
-- 租户Schema迁移验证脚本
-- ========================================
-- 用途：验证tenant_test_company_a schema中的所有表是否已正确创建
-- 执行方式：在DBeaver、pgAdmin或psql中执行此脚本
-- ========================================

\echo '========================================';
\echo '1. 检查租户状态';
\echo '========================================';
SELECT id, name, schema_name, status, created_at
FROM public.tenants
WHERE schema_name = 'tenant_test_company_a';

\echo '';
\echo '========================================';
\echo '2. 列出tenant_test_company_a中的所有表';
\echo '========================================';
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('application_audit_logs', 'exam_admins', 'exam_reviewers', 
                           'exam_scores', 'payment_orders', 'review_tasks', 
                           'ticket_number_rules', 'ticket_sequences') 
        THEN '✓ 新增'
        ELSE ''
    END as status
FROM information_schema.tables 
WHERE table_schema = 'tenant_test_company_a' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo '';
\echo '========================================';
\echo '3. 统计表数量';
\echo '========================================';
SELECT 
    COUNT(*) as total_tables,
    CASE 
        WHEN COUNT(*) = 19 THEN '✓ 正确（预期19个表）'
        WHEN COUNT(*) = 11 THEN '✗ 缺少8个表（迁移未执行）'
        ELSE '⚠ 异常（预期19个表，实际' || COUNT(*) || '个）'
    END as validation_result
FROM information_schema.tables 
WHERE table_schema = 'tenant_test_company_a' 
  AND table_type = 'BASE TABLE';

\echo '';
\echo '========================================';
\echo '4. 检查Flyway迁移历史';
\echo '========================================';
SELECT 
    installed_rank,
    version,
    description,
    type,
    installed_on,
    execution_time,
    success,
    CASE 
        WHEN version::int >= 6 THEN '✓ 新增'
        ELSE ''
    END as status
FROM tenant_test_company_a.flyway_schema_history
ORDER BY installed_rank;

\echo '';
\echo '========================================';
\echo '5. 验证新增表的存在性';
\echo '========================================';
SELECT 
    'review_tasks' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'review_tasks'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END as status
UNION ALL
SELECT 
    'exam_reviewers',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'exam_reviewers'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 
    'exam_admins',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'exam_admins'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 
    'exam_scores',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'exam_scores'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 
    'payment_orders',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'payment_orders'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 
    'ticket_number_rules',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'ticket_number_rules'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 
    'ticket_sequences',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'ticket_sequences'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 
    'application_audit_logs',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'application_audit_logs'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END;

\echo '';
\echo '========================================';
\echo '6. 检查新表的列数';
\echo '========================================';
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'tenant_test_company_a'
  AND table_name IN (
    'review_tasks', 'exam_reviewers', 'exam_admins', 'exam_scores',
    'payment_orders', 'ticket_number_rules', 'ticket_sequences', 'application_audit_logs'
  )
GROUP BY table_name
ORDER BY table_name;

\echo '';
\echo '========================================';
\echo '7. 检查新表的索引';
\echo '========================================';
SELECT 
    tablename as table_name,
    indexname as index_name,
    indexdef as index_definition
FROM pg_indexes
WHERE schemaname = 'tenant_test_company_a'
  AND tablename IN (
    'review_tasks', 'exam_reviewers', 'exam_admins', 'exam_scores',
    'payment_orders', 'ticket_number_rules', 'ticket_sequences', 'application_audit_logs'
  )
ORDER BY tablename, indexname;

\echo '';
\echo '========================================';
\echo '8. 检查外键约束';
\echo '========================================';
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'tenant_test_company_a'
  AND tc.table_name IN (
    'review_tasks', 'exam_reviewers', 'exam_admins', 'exam_scores',
    'payment_orders', 'ticket_number_rules', 'ticket_sequences', 'application_audit_logs'
  )
ORDER BY tc.table_name, tc.constraint_name;

\echo '';
\echo '========================================';
\echo '验证完成！';
\echo '========================================';
\echo '预期结果：';
\echo '- 总表数：19个';
\echo '- 新增表：8个（review_tasks, exam_reviewers, exam_admins, exam_scores,';
\echo '           payment_orders, ticket_number_rules, ticket_sequences, application_audit_logs）';
\echo '- Flyway历史：10条记录（V001-V010）';
\echo '========================================';

