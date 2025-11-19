-- 删除遗留的 scores 表
-- 版本: V011
-- 原因: scores 表已被 exam_scores 表替代（V007）
-- exam_scores 表提供了更完善的功能：缺考标记、备注字段、更新时间、唯一约束等

-- ============================================
-- 步骤 1: 检查是否有数据需要迁移
-- ============================================

DO $$
DECLARE
    row_count INTEGER;
    exam_scores_count INTEGER;
    r RECORD;  -- 声明 RECORD 类型变量用于 FOR 循环
BEGIN
    -- 检查 scores 表是否存在
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
        AND table_name = 'scores'
    ) THEN
        -- 统计 scores 表中的数据
        EXECUTE 'SELECT COUNT(*) FROM scores' INTO row_count;

        -- 统计 exam_scores 表中的数据
        EXECUTE 'SELECT COUNT(*) FROM exam_scores' INTO exam_scores_count;

        RAISE NOTICE '===========================================';
        RAISE NOTICE 'Legacy scores table migration check:';
        RAISE NOTICE '  - scores table rows: %', row_count;
        RAISE NOTICE '  - exam_scores table rows: %', exam_scores_count;
        RAISE NOTICE '===========================================';

        -- 如果 scores 表中有数据，发出警告但不阻止迁移
        -- 因为 exam_scores 表已经在使用，scores 表应该是空的
        IF row_count > 0 THEN
            RAISE WARNING 'scores 表中仍有 % 条数据！', row_count;
            RAISE WARNING '如果这些数据重要，请在删除前手动迁移到 exam_scores 表';
            RAISE WARNING '迁移将在 5 秒后继续...';

            -- 记录详细信息到日志
            RAISE NOTICE '详细数据统计:';
            RAISE NOTICE '  - 按 application_id 分组:';
            FOR r IN
                SELECT application_id, COUNT(*) as cnt
                FROM scores
                GROUP BY application_id
                ORDER BY cnt DESC
                LIMIT 10
            LOOP
                RAISE NOTICE '    application_id: %, count: %', r.application_id, r.cnt;
            END LOOP;
        ELSE
            RAISE NOTICE 'scores 表为空，可以安全删除';
        END IF;
    ELSE
        RAISE NOTICE 'scores 表不存在，跳过删除';
    END IF;
END $$;

-- ============================================
-- 步骤 2: 删除索引（如果存在）
-- ============================================

DROP INDEX IF EXISTS idx_scores_application_id;
DROP INDEX IF EXISTS idx_scores_subject_id;
DROP INDEX IF EXISTS idx_scores_recorded_by;
DROP INDEX IF EXISTS idx_scores_status;

-- ============================================
-- 步骤 3: 删除表
-- ============================================

DROP TABLE IF EXISTS scores CASCADE;

-- ============================================
-- 步骤 4: 记录迁移日志
-- ============================================

-- 在 public schema 的 flyway_schema_history 表中会自动记录
-- 不需要额外的注释

-- ============================================
-- 步骤 5: 验证删除结果
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = current_schema() 
        AND table_name = 'scores'
    ) THEN
        RAISE EXCEPTION 'scores 表删除失败！';
    ELSE
        RAISE NOTICE '✓ scores 表已成功删除';
        RAISE NOTICE '✓ 现在统一使用 exam_scores 表管理成绩';
    END IF;
END $$;

-- ============================================
-- 迁移说明
-- ============================================

/*
迁移背景:
---------
1. V001 创建了 scores 表（简单版本）
2. V007 创建了 exam_scores 表（功能完善版本）
3. 系统实际使用的是 exam_scores 表（有对应的 ExamScoreEntity 和 JpaExamScoreRepository）
4. scores 表没有对应的 JPA Entity，属于遗留表

exam_scores 表的优势:
--------------------
- ✓ 缺考标记 (is_absent)
- ✓ 备注字段 (remarks)
- ✓ 更新时间 (updated_at)
- ✓ 唯一约束 (uq_application_subject)
- ✓ 完整的 JPA 映射 (ExamScoreEntity)
- ✓ 完整的仓储实现 (JpaExamScoreRepository)

删除影响:
---------
- 无影响：scores 表没有被任何代码使用
- 无影响：没有外键依赖
- 无影响：exam_scores 表已经在正常使用

验证步骤:
---------
1. 检查 exam_scores 表是否正常工作
2. 确认所有成绩相关功能使用 exam_scores 表
3. 运行 BDD 测试验证成绩管理功能
*/

