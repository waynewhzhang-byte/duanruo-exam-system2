-- V015: 扩展敏感字段列长度以支持加密存储
-- 加密后的数据长度会增加，需要扩展列长度

-- ============================================
-- Public Schema: 扩展用户表和租户表的敏感字段
-- ============================================

-- 扩展 users 表的敏感字段
ALTER TABLE public.users
    ALTER COLUMN email TYPE VARCHAR(500),
    ALTER COLUMN full_name TYPE VARCHAR(500),
    ALTER COLUMN phone_number TYPE VARCHAR(500);

COMMENT ON COLUMN public.users.email IS '邮箱（AES加密存储）';
COMMENT ON COLUMN public.users.full_name IS '全名（AES加密存储）';
COMMENT ON COLUMN public.users.phone_number IS '手机号（AES加密存储）';

-- 扩展 tenants 表的敏感字段
ALTER TABLE public.tenants
    ALTER COLUMN contact_email TYPE VARCHAR(500),
    ALTER COLUMN contact_phone TYPE VARCHAR(500);

COMMENT ON COLUMN public.tenants.contact_email IS '联系邮箱（AES加密存储）';
COMMENT ON COLUMN public.tenants.contact_phone IS '联系电话（AES加密存储）';

-- ============================================
-- 创建函数：为租户 schema 扩展敏感字段列长度
-- ============================================

CREATE OR REPLACE FUNCTION extend_tenant_columns_for_encryption(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- 扩展 tickets 表的敏感字段（仅当表存在）
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = schema_name AND table_name = 'tickets'
    ) THEN
        EXECUTE format('
            ALTER TABLE %I.tickets
                ALTER COLUMN candidate_name TYPE VARCHAR(500),
                ALTER COLUMN candidate_id_number TYPE VARCHAR(500)
        ', schema_name);

        EXECUTE format('
            COMMENT ON COLUMN %I.tickets.candidate_name IS ''考生姓名（AES加密存储）''
        ', schema_name);

        EXECUTE format('
            COMMENT ON COLUMN %I.tickets.candidate_id_number IS ''考生身份证号（AES加密存储）''
        ', schema_name);
    END IF;
    
    RAISE NOTICE 'Extended columns for encryption in schema: %', schema_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 为所有现有租户 schema 扩展列长度
-- ============================================

DO $$
DECLARE
    tenant_record RECORD;
BEGIN
    FOR tenant_record IN 
        SELECT schema_name 
        FROM public.tenants 
        WHERE status = 'ACTIVE'
    LOOP
        PERFORM extend_tenant_columns_for_encryption(tenant_record.schema_name);
    END LOOP;
END $$;

-- ============================================
-- 说明
-- ============================================

-- 1. 本迁移脚本扩展了以下敏感字段的列长度：
--    - public.users: email, full_name, phone_number (100 -> 500)
--    - public.tenants: contact_email, contact_phone (100/20 -> 500)
--    - tenant_xxx.tickets: candidate_name, candidate_id_number (100/50 -> 500)
--
-- 2. 加密后的数据长度计算：
--    - AES-256-CBC 加密后的数据长度 = Base64(IV + 加密数据)
--    - IV: 16 bytes
--    - 加密数据: (原始数据长度 + padding) 向上取整到 16 的倍数
--    - Base64 编码后长度约为原始长度的 1.33 倍
--    - 例如：100 字符的原始数据加密后约为 200 字符
--    - 设置为 500 可以支持最长约 300 字符的原始数据
--
-- 3. 注意事项：
--    - 本迁移脚本只扩展列长度，不加密现有数据
--    - 现有数据将在应用启动后首次更新时自动加密
--    - 如果需要立即加密现有数据，请运行单独的数据迁移脚本
--
-- 4. 性能影响：
--    - 扩展列长度是 DDL 操作，会锁表
--    - 建议在低峰期执行
--    - 对于大表，可能需要较长时间

