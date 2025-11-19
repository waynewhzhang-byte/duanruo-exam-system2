-- 手动执行加密字段扩展迁移
-- 连接到数据库: psql -U postgres -d duanruo-exam-system -f execute-encryption-migration.sql

\echo '========================================';
\echo '开始执行加密字段扩展迁移';
\echo '========================================';

-- ============================================
-- Public Schema: 扩展用户表和租户表的敏感字段
-- ============================================

\echo '扩展 users 表的敏感字段...';
ALTER TABLE public.users
    ALTER COLUMN email TYPE VARCHAR(500),
    ALTER COLUMN full_name TYPE VARCHAR(500),
    ALTER COLUMN phone_number TYPE VARCHAR(500);

COMMENT ON COLUMN public.users.email IS '邮箱（AES加密存储）';
COMMENT ON COLUMN public.users.full_name IS '全名（AES加密存储）';
COMMENT ON COLUMN public.users.phone_number IS '手机号（AES加密存储）';

\echo '扩展 tenants 表的敏感字段...';
ALTER TABLE public.tenants
    ALTER COLUMN contact_email TYPE VARCHAR(500),
    ALTER COLUMN contact_phone TYPE VARCHAR(500);

COMMENT ON COLUMN public.tenants.contact_email IS '联系邮箱（AES加密存储）';
COMMENT ON COLUMN public.tenants.contact_phone IS '联系电话（AES加密存储）';

-- ============================================
-- 为所有现有租户 schema 扩展列长度
-- ============================================

\echo '扩展租户 schema 的敏感字段...';

DO $$
DECLARE
    tenant_record RECORD;
    schema_count INTEGER := 0;
BEGIN
    FOR tenant_record IN 
        SELECT schema_name 
        FROM public.tenants 
        WHERE status = 'ACTIVE'
    LOOP
        -- 扩展 tickets 表的敏感字段
        EXECUTE format('
            ALTER TABLE %I.tickets
                ALTER COLUMN candidate_name TYPE VARCHAR(500),
                ALTER COLUMN candidate_id_number TYPE VARCHAR(500)
        ', tenant_record.schema_name);
        
        EXECUTE format('
            COMMENT ON COLUMN %I.tickets.candidate_name IS ''考生姓名（AES加密存储）''
        ', tenant_record.schema_name);
        
        EXECUTE format('
            COMMENT ON COLUMN %I.tickets.candidate_id_number IS ''考生身份证号（AES加密存储）''
        ', tenant_record.schema_name);
        
        schema_count := schema_count + 1;
        RAISE NOTICE '已扩展 schema: %', tenant_record.schema_name;
    END LOOP;
    
    RAISE NOTICE '共扩展了 % 个租户 schema', schema_count;
END $$;

-- ============================================
-- 记录迁移历史
-- ============================================

\echo '记录迁移历史...';

INSERT INTO public.flyway_schema_history (
    installed_rank,
    version,
    description,
    type,
    script,
    checksum,
    installed_by,
    installed_on,
    execution_time,
    success
) VALUES (
    (SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM public.flyway_schema_history),
    '015',
    'Extend columns for encryption',
    'SQL',
    'V015__Extend_columns_for_encryption.sql',
    0,
    current_user,
    current_timestamp,
    0,
    true
) ON CONFLICT DO NOTHING;

\echo '========================================';
\echo '迁移完成！';
\echo '========================================';

