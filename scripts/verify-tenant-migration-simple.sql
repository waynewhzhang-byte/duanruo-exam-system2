-- ========================================
-- 租户Schema迁移验证脚本（简化版）
-- 适用于DBeaver、pgAdmin等GUI工具
-- ========================================

-- 1. 检查租户状态
SELECT '=== 1. 租户状态 ===' as step;
SELECT id, name, schema_name, status, created_at
FROM public.tenants
WHERE schema_name = 'tenant_test_company_a';

-- 2. 列出所有表（标记新增表）
SELECT '=== 2. 所有表列表 ===' as step;
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

-- 3. 统计表数量
SELECT '=== 3. 表数量统计 ===' as step;
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

-- 4. 检查Flyway迁移历史
SELECT '=== 4. Flyway迁移历史 ===' as step;
SELECT 
    installed_rank,
    version,
    description,
    installed_on,
    success,
    CASE 
        WHEN version::int >= 6 THEN '✓ 新增'
        ELSE ''
    END as status
FROM tenant_test_company_a.flyway_schema_history
ORDER BY installed_rank;

-- 5. 验证8个新表是否都存在
SELECT '=== 5. 新表存在性验证 ===' as step;
SELECT 
    'review_tasks' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'review_tasks'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END as status
UNION ALL
SELECT 'exam_reviewers',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'exam_reviewers'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 'exam_admins',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'exam_admins'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 'exam_scores',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'exam_scores'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 'payment_orders',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'payment_orders'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 'ticket_number_rules',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'ticket_number_rules'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 'ticket_sequences',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'ticket_sequences'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END
UNION ALL
SELECT 'application_audit_logs',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'tenant_test_company_a' 
          AND table_name = 'application_audit_logs'
    ) THEN '✓ 存在' ELSE '✗ 不存在' END;

-- 验证完成提示
SELECT '=== 验证完成 ===' as step;
SELECT 
    '预期结果：19个表，其中8个新增表' as expected,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tenant_test_company_a' 
       AND table_type = 'BASE TABLE') as actual_tables,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'tenant_test_company_a' 
       AND table_type = 'BASE TABLE'
       AND table_name IN ('application_audit_logs', 'exam_admins', 'exam_reviewers', 
                         'exam_scores', 'payment_orders', 'review_tasks', 
                         'ticket_number_rules', 'ticket_sequences')) as new_tables;

