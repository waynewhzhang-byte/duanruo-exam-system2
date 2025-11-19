-- 租户Schema性能优化索引
-- 版本: V002
-- 描述: 为租户Schema添加复合索引和优化查询性能
-- 兼容性: 支持历史租户schema，仅在列存在时创建索引

-- ============================================
-- 辅助函数：安全创建索引（仅在列存在时）
-- ============================================

CREATE OR REPLACE FUNCTION create_index_if_columns_exist(
    p_index_name TEXT,
    p_table_name TEXT,
    p_columns TEXT[],
    p_index_definition TEXT
) RETURNS VOID AS $$
DECLARE
    v_column TEXT;
    v_all_exist BOOLEAN := TRUE;
BEGIN
    -- 检查所有列是否存在
    FOREACH v_column IN ARRAY p_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = p_table_name
              AND column_name = v_column
        ) THEN
            v_all_exist := FALSE;
            EXIT;
        END IF;
    END LOOP;

    -- 如果所有列都存在，则创建索引
    IF v_all_exist THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I %s', p_index_name, p_index_definition);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Exams 表索引
-- ============================================

-- 基础索引
CREATE INDEX IF NOT EXISTS idx_exams_code ON exams(code);
-- slug 列在 V001 未定义，需兼容旧结构：仅当存在 slug 列时创建索引
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'exams' AND column_name = 'slug'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_exams_slug ON exams(slug)';
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);
CREATE INDEX IF NOT EXISTS idx_exams_created_at ON exams(created_at);

-- 复合索引：状态 + 报名截止时间（用于自动关闭报名）
CREATE INDEX IF NOT EXISTS idx_exams_status_reg_end 
ON exams(status, registration_end) 
WHERE status = 'OPEN';

-- 复合索引：状态 + 创建时间（用于列表查询）
CREATE INDEX IF NOT EXISTS idx_exams_status_created 
ON exams(status, created_at DESC);

-- ============================================
-- Positions 表索引
-- ============================================

-- 基础索引
CREATE INDEX IF NOT EXISTS idx_positions_exam_id ON positions(exam_id);
CREATE INDEX IF NOT EXISTS idx_positions_code ON positions(code);
CREATE INDEX IF NOT EXISTS idx_positions_created_at ON positions(created_at);

-- 复合索引：考试ID + 代码（用于唯一性检查）
CREATE INDEX IF NOT EXISTS idx_positions_exam_code 
ON positions(exam_id, code);

-- ============================================
-- Subjects 表索引
-- ============================================

-- 基础索引
CREATE INDEX IF NOT EXISTS idx_subjects_position_id ON subjects(position_id);
CREATE INDEX IF NOT EXISTS idx_subjects_created_at ON subjects(created_at);

-- 复合索引：岗位ID + 排序（用于科目列表查询）
-- ordering 列在历史schema中可能不存在，需兼容
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'subjects' AND column_name = 'ordering'
    ) THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_subjects_position_ordering ON subjects(position_id, ordering)';
    END IF;
END $$;

-- ============================================
-- Applications 表索引
-- ============================================

-- 基础索引（使用辅助函数确保列存在）
SELECT create_index_if_columns_exist('idx_applications_exam_id', 'applications', ARRAY['exam_id'], 'ON applications(exam_id)');
SELECT create_index_if_columns_exist('idx_applications_candidate_id', 'applications', ARRAY['candidate_id'], 'ON applications(candidate_id)');
SELECT create_index_if_columns_exist('idx_applications_position_id', 'applications', ARRAY['position_id'], 'ON applications(position_id)');
SELECT create_index_if_columns_exist('idx_applications_status', 'applications', ARRAY['status'], 'ON applications(status)');
SELECT create_index_if_columns_exist('idx_applications_created_at', 'applications', ARRAY['created_at'], 'ON applications(created_at)');
SELECT create_index_if_columns_exist('idx_applications_updated_at', 'applications', ARRAY['updated_at'], 'ON applications(updated_at)');
SELECT create_index_if_columns_exist('idx_applications_submitted_at', 'applications', ARRAY['submitted_at'], 'ON applications(submitted_at)');

-- 复合索引：考试ID + 状态（用于统计和列表查询）
SELECT create_index_if_columns_exist('idx_applications_exam_status', 'applications', ARRAY['exam_id', 'status'], 'ON applications(exam_id, status)');

-- 复合索引：候选人ID + 状态（用于候选人查看自己的报名）
SELECT create_index_if_columns_exist('idx_applications_candidate_status', 'applications', ARRAY['candidate_id', 'status'], 'ON applications(candidate_id, status)');

-- 复合索引：岗位ID + 状态（用于统计岗位报名数）
SELECT create_index_if_columns_exist('idx_applications_position_status', 'applications', ARRAY['position_id', 'status'], 'ON applications(position_id, status)');

-- 复合索引：状态 + 提交时间（用于审核队列）
-- 注意：WHERE子句需要在索引定义中，不能通过辅助函数传递，因此使用DO块
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'applications' AND column_name = 'status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'applications' AND column_name = 'submitted_at') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_applications_status_submitted ON applications(status, submitted_at) WHERE status IN (''SUBMITTED'', ''PENDING_PRIMARY_REVIEW'', ''PENDING_SECONDARY_REVIEW'')';
    END IF;
END $$;

-- 复合索引：考试ID + 候选人ID（用于检查重复报名）
SELECT create_index_if_columns_exist('idx_applications_exam_candidate', 'applications', ARRAY['exam_id', 'candidate_id'], 'ON applications(exam_id, candidate_id)');

-- ============================================
-- Files 表索引（如果存在）
-- ============================================

-- 基础索引（使用辅助函数）
SELECT create_index_if_columns_exist('idx_files_application_id', 'files', ARRAY['application_id'], 'ON files(application_id)');
SELECT create_index_if_columns_exist('idx_files_uploaded_by', 'files', ARRAY['uploaded_by'], 'ON files(uploaded_by)');
SELECT create_index_if_columns_exist('idx_files_status', 'files', ARRAY['status'], 'ON files(status)');
SELECT create_index_if_columns_exist('idx_files_created_at', 'files', ARRAY['created_at'], 'ON files(created_at)');

-- 复合索引：报名ID + 字段键（用于查找特定附件）
SELECT create_index_if_columns_exist('idx_files_application_field', 'files', ARRAY['application_id', 'field_key'], 'ON files(application_id, field_key)');

-- 复合索引：上传者 + 状态（用于查看用户文件）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'files' AND column_name = 'uploaded_by')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'files' AND column_name = 'status') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_files_uploaded_by_status ON files(uploaded_by, status) WHERE uploaded_by IS NOT NULL';
    END IF;
END $$;

-- 复合索引：状态 + 创建时间（用于清理过期文件）
SELECT create_index_if_columns_exist('idx_files_status_created', 'files', ARRAY['status', 'created_at'], 'ON files(status, created_at)');

-- 病毒扫描状态索引
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'files' AND column_name = 'virus_scan_status') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_files_virus_scan_status ON files(virus_scan_status) WHERE virus_scan_status IN (''PENDING'', ''SCANNING'')';
    END IF;
END $$;

-- ============================================
-- Review Tasks 表索引（如果存在）
-- ============================================

-- review_tasks 表在 V001 中未定义，仅在存在时创建索引
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = 'review_tasks'
    ) THEN
        -- 基础索引
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_review_tasks_application_id ON review_tasks(application_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_review_tasks_assigned_to ON review_tasks(assigned_to)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_review_tasks_status ON review_tasks(status)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_review_tasks_stage ON review_tasks(stage)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_review_tasks_created_at ON review_tasks(created_at)';

        -- 复合索引：报名ID + 阶段 + 状态（用于查找活跃任务）
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_review_tasks_app_stage_status ON review_tasks(application_id, stage, status)';

        -- 复合索引：分配给 + 状态（用于审核员工作台）
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_review_tasks_assigned_status ON review_tasks(assigned_to, status) WHERE assigned_to IS NOT NULL';

        -- 复合索引：状态 + 创建时间（用于任务队列）
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_review_tasks_status_created ON review_tasks(status, created_at) WHERE status IN (''OPEN'', ''ASSIGNED'')';

        -- 复合索引：阶段 + 状态 + 创建时间（用于分级审核队列）
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_review_tasks_stage_status_created ON review_tasks(stage, status, created_at)';
    END IF;
END $$;

-- ============================================
-- Reviews 表索引
-- ============================================

-- 基础索引（使用辅助函数）
SELECT create_index_if_columns_exist('idx_reviews_application_id', 'reviews', ARRAY['application_id'], 'ON reviews(application_id)');
SELECT create_index_if_columns_exist('idx_reviews_reviewer_id', 'reviews', ARRAY['reviewer_id'], 'ON reviews(reviewer_id)');
SELECT create_index_if_columns_exist('idx_reviews_review_level', 'reviews', ARRAY['review_level'], 'ON reviews(review_level)');
SELECT create_index_if_columns_exist('idx_reviews_decision', 'reviews', ARRAY['decision'], 'ON reviews(decision)');
SELECT create_index_if_columns_exist('idx_reviews_created_at', 'reviews', ARRAY['created_at'], 'ON reviews(created_at)');

-- 复合索引：报名ID + 审核级别（用于查找特定级别的审核记录）
SELECT create_index_if_columns_exist('idx_reviews_application_level', 'reviews', ARRAY['application_id', 'review_level'], 'ON reviews(application_id, review_level)');

-- 复合索引：审核员ID + 审核级别（用于审核员工作统计）
SELECT create_index_if_columns_exist('idx_reviews_reviewer_level', 'reviews', ARRAY['reviewer_id', 'review_level'], 'ON reviews(reviewer_id, review_level)');

-- 复合索引：决定 + 创建时间（用于审核统计）
SELECT create_index_if_columns_exist('idx_reviews_decision_created', 'reviews', ARRAY['decision', 'created_at'], 'ON reviews(decision, created_at)');

-- ============================================
-- Tickets 表索引
-- ============================================

-- 基础索引（使用辅助函数）
SELECT create_index_if_columns_exist('idx_tickets_application_id', 'tickets', ARRAY['application_id'], 'ON tickets(application_id)');
SELECT create_index_if_columns_exist('idx_tickets_ticket_no', 'tickets', ARRAY['ticket_no'], 'ON tickets(ticket_no)');
SELECT create_index_if_columns_exist('idx_tickets_exam_id', 'tickets', ARRAY['exam_id'], 'ON tickets(exam_id)');
SELECT create_index_if_columns_exist('idx_tickets_status', 'tickets', ARRAY['status'], 'ON tickets(status)');
SELECT create_index_if_columns_exist('idx_tickets_created_at', 'tickets', ARRAY['created_at'], 'ON tickets(created_at)');

-- 复合索引：考试ID + 状态（用于统计准考证）
SELECT create_index_if_columns_exist('idx_tickets_exam_status', 'tickets', ARRAY['exam_id', 'status'], 'ON tickets(exam_id, status)');

-- ============================================
-- Payment Orders 表索引（如果存在）
-- ============================================

-- payment_orders 表在 V001 中未定义，仅在存在时创建索引
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = 'payment_orders'
    ) THEN
        -- 基础索引
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_orders_application_id ON payment_orders(application_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_orders_order_no ON payment_orders(order_no)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at)';

        -- 复合索引：状态 + 创建时间（用于查找待支付订单）
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_orders_status_created ON payment_orders(status, created_at) WHERE status IN (''PENDING'', ''PROCESSING'')';

        -- 复合索引：支付方式 + 状态（用于支付统计）
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_orders_method_status ON payment_orders(payment_method, status)';
    END IF;
END $$;

-- ============================================
-- Candidates 表索引（如果存在）
-- ============================================

-- candidates 表在 V001 中未定义，仅在存在时创建索引
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = 'candidates'
    ) THEN
        -- 基础索引
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_candidates_id_number ON candidates(id_number)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at)';

        -- 身份证号部分索引（用于模糊查询）
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_candidates_id_number_prefix ON candidates(LEFT(id_number, 6))';
    END IF;
END $$;

-- ============================================
-- 分析表以更新统计信息
-- ============================================

-- 仅分析存在的表（所有表都需要检查）
DO $$
BEGIN
    -- 检查并分析每个表
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'exams') THEN
        ANALYZE exams;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'positions') THEN
        ANALYZE positions;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'subjects') THEN
        ANALYZE subjects;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'applications') THEN
        ANALYZE applications;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'files') THEN
        ANALYZE files;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'reviews') THEN
        ANALYZE reviews;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'tickets') THEN
        ANALYZE tickets;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'review_tasks') THEN
        ANALYZE review_tasks;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'payment_orders') THEN
        ANALYZE payment_orders;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'candidates') THEN
        ANALYZE candidates;
    END IF;
END $$;

-- ============================================
-- 注释（仅在索引存在时添加）
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_exams_status_reg_end') THEN
        EXECUTE 'COMMENT ON INDEX idx_exams_status_reg_end IS ''用于自动关闭报名的复合索引''';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_applications_exam_status') THEN
        EXECUTE 'COMMENT ON INDEX idx_applications_exam_status IS ''用于统计考试报名数的复合索引''';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_applications_status_submitted') THEN
        EXECUTE 'COMMENT ON INDEX idx_applications_status_submitted IS ''用于审核队列的复合索引''';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_review_tasks_app_stage_status') THEN
        EXECUTE 'COMMENT ON INDEX idx_review_tasks_app_stage_status IS ''用于查找活跃审核任务的复合索引''';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_files_application_field') THEN
        EXECUTE 'COMMENT ON INDEX idx_files_application_field IS ''用于查找特定附件的复合索引''';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_tickets_exam_status') THEN
        EXECUTE 'COMMENT ON INDEX idx_tickets_exam_status IS ''用于统计准考证的复合索引''';
    END IF;
END $$;

-- ============================================
-- 清理辅助函数
-- ============================================

DROP FUNCTION IF EXISTS create_index_if_columns_exist(TEXT, TEXT, TEXT[], TEXT);
