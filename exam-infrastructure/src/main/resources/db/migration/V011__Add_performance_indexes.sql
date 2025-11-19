-- 性能优化索引
-- 为提升查询性能添加关键索引

-- ============================================
-- Public Schema 索引
-- ============================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 用户租户角色表索引
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_user_id ON user_tenant_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_tenant_id ON user_tenant_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_user_tenant ON user_tenant_roles(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_active ON user_tenant_roles(active);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_role ON user_tenant_roles(role);

-- 租户表索引
CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_schema_name ON tenants(schema_name);

-- ============================================
-- 租户Schema索引创建函数
-- ============================================

-- 创建函数：为指定租户Schema添加性能索引
CREATE OR REPLACE FUNCTION create_tenant_performance_indexes(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- 设置search_path到租户schema
    EXECUTE format('SET search_path TO %I, public', schema_name);
    
    -- Exams表索引
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_exams_code ON %I.exams(code)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_exams_status ON %I.exams(status)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_exams_created_at ON %I.exams(created_at)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_exams_registration_start ON %I.exams(registration_start)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_exams_registration_end ON %I.exams(registration_end)', schema_name);

    
    -- Positions表索引
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_positions_exam_id ON %I.positions(exam_id)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_positions_code ON %I.positions(code)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_positions_created_at ON %I.positions(created_at)', schema_name);
    
    -- Subjects表索引
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_subjects_position_id ON %I.subjects(position_id)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_subjects_created_at ON %I.subjects(created_at)', schema_name);
    
    -- Applications表索引
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_applications_exam_id ON %I.applications(exam_id)', schema_name);
    -- 兼容旧租户：仅当存在candidate_id列时才创建对应索引
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = schema_name AND table_name = 'applications' AND column_name = 'candidate_id'
    ) THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON %I.applications(candidate_id)', schema_name);
    END IF;
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_applications_position_id ON %I.applications(position_id)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_applications_status ON %I.applications(status)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_applications_created_at ON %I.applications(created_at)', schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_applications_updated_at ON %I.applications(updated_at)', schema_name);
    
    -- 复合索引：常用查询组合
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_applications_exam_status ON %I.applications(exam_id, status)', schema_name);
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = schema_name AND table_name = 'applications' AND column_name = 'candidate_id'
    ) THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_applications_candidate_status ON %I.applications(candidate_id, status)', schema_name);
    END IF;

    -- Reviews表索引（存在即建）
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = schema_name AND table_name = 'reviews'
    ) THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_reviews_application_id ON %I.reviews(application_id)', schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON %I.reviews(reviewer_id)', schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_reviews_review_level ON %I.reviews(review_level)', schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_reviews_decision ON %I.reviews(decision)', schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON %I.reviews(created_at)', schema_name);
    END IF;

    -- 复合索引：审核员查询待审核申请
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = schema_name AND table_name = 'reviews'
    ) THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_level ON %I.reviews(reviewer_id, review_level)', schema_name);
    END IF;

    -- Tickets表索引（存在即建）
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = schema_name AND table_name = 'tickets'
    ) THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_tickets_application_id ON %I.tickets(application_id)', schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON %I.tickets(ticket_number)', schema_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON %I.tickets(created_at)', schema_name);
    END IF;

    -- 恢复search_path
    EXECUTE 'SET search_path TO public';
    
    RAISE NOTICE 'Performance indexes created for schema: %', schema_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 为现有租户Schema创建索引
-- ============================================

-- 为所有ACTIVE租户创建索引（从public.tenants表动态读取；排除public）
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT schema_name FROM tenants WHERE status = 'ACTIVE' AND schema_name <> 'public' LOOP
        EXECUTE format('SELECT create_tenant_performance_indexes(%L)', r.schema_name);
    END LOOP;
END $$;

-- ============================================
-- 分析表以更新统计信息
-- ============================================

-- Public schema表
ANALYZE users;
ANALYZE user_tenant_roles;
ANALYZE tenants;

-- 为租户schema表创建分析函数
CREATE OR REPLACE FUNCTION analyze_tenant_tables(schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'exams') THEN
        EXECUTE format('ANALYZE %I.exams', schema_name);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'positions') THEN
        EXECUTE format('ANALYZE %I.positions', schema_name);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'subjects') THEN
        EXECUTE format('ANALYZE %I.subjects', schema_name);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'applications') THEN
        EXECUTE format('ANALYZE %I.applications', schema_name);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'reviews') THEN
        EXECUTE format('ANALYZE %I.reviews', schema_name);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = schema_name AND table_name = 'tickets') THEN
        EXECUTE format('ANALYZE %I.tickets', schema_name);
    END IF;

    RAISE NOTICE 'Tables analyzed for schema: %', schema_name;
END;
$$ LANGUAGE plpgsql;

-- 分析现有租户表
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT schema_name FROM tenants WHERE status = 'ACTIVE' AND schema_name <> 'public' LOOP
        EXECUTE format('SELECT analyze_tenant_tables(%L)', r.schema_name);
    END LOOP;
END $$;

-- ============================================
-- 创建性能监控视图
-- ============================================

-- 索引使用情况视图
CREATE OR REPLACE VIEW v_index_usage AS
SELECT
    schemaname,
    relname AS tablename,
    indexrelname AS indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- 表大小和统计信息视图
CREATE OR REPLACE VIEW v_table_stats AS
SELECT
    schemaname,
    relname AS tablename,
    pg_size_pretty(pg_total_relation_size(format('%I.%I', schemaname, relname))) AS total_size,
    pg_size_pretty(pg_relation_size(format('%I.%I', schemaname, relname))) AS table_size,
    pg_size_pretty(pg_total_relation_size(format('%I.%I', schemaname, relname)) - pg_relation_size(format('%I.%I', schemaname, relname))) AS indexes_size,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(format('%I.%I', schemaname, relname)) DESC;

-- 慢查询视图（需要启用pg_stat_statements扩展）
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE OR REPLACE VIEW v_slow_queries AS
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time,
    rows
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- 平均执行时间超过100ms
ORDER BY mean_exec_time DESC
LIMIT 50;

-- ============================================
-- 注释
-- ============================================

COMMENT ON FUNCTION create_tenant_performance_indexes(TEXT) IS '为指定租户Schema创建性能优化索引';
COMMENT ON FUNCTION analyze_tenant_tables(TEXT) IS '分析指定租户Schema的所有表以更新统计信息';
COMMENT ON VIEW v_index_usage IS '索引使用情况统计视图';
COMMENT ON VIEW v_table_stats IS '表大小和统计信息视图';
COMMENT ON VIEW v_slow_queries IS '慢查询统计视图（需要pg_stat_statements扩展）';

