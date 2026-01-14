-- ================================================================
-- 添加缺失的外键约束脚本
-- 目的：为所有租户schema中引用public.users.id的字段添加外键约束
-- 执行方式：直接执行此SQL脚本，不依赖Flyway
-- ================================================================

-- 函数：为指定schema添加外键约束
CREATE OR REPLACE FUNCTION add_foreign_keys_to_tenant_schema(schema_name TEXT)
RETURNS VOID AS $$
DECLARE
    sql_text TEXT;
    constraint_exists BOOLEAN;
BEGIN
    -- 1. exam_reviewers.reviewer_id -> public.users.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = schema_name
        AND table_name = 'exam_reviewers'
        AND constraint_name = 'fk_exam_reviewers_reviewer'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        sql_text := format('
            ALTER TABLE %I.exam_reviewers
            ADD CONSTRAINT fk_exam_reviewers_reviewer
            FOREIGN KEY (reviewer_id)
            REFERENCES public.users(id)
            ON DELETE CASCADE;
        ', schema_name);
        EXECUTE sql_text;
        RAISE NOTICE 'Added fk_exam_reviewers_reviewer to schema: %', schema_name;
    END IF;

    -- 2. reviews.reviewer_id -> public.users.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = schema_name
        AND table_name = 'reviews'
        AND constraint_name = 'fk_reviews_reviewer'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        sql_text := format('
            ALTER TABLE %I.reviews
            ADD CONSTRAINT fk_reviews_reviewer
            FOREIGN KEY (reviewer_id)
            REFERENCES public.users(id)
            ON DELETE CASCADE;
        ', schema_name);
        EXECUTE sql_text;
        RAISE NOTICE 'Added fk_reviews_reviewer to schema: %', schema_name;
    END IF;

    -- 3. review_tasks.assigned_to -> public.users.id (nullable)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = schema_name
        AND table_name = 'review_tasks'
        AND constraint_name = 'fk_review_tasks_assigned_to'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        sql_text := format('
            ALTER TABLE %I.review_tasks
            ADD CONSTRAINT fk_review_tasks_assigned_to
            FOREIGN KEY (assigned_to)
            REFERENCES public.users(id)
            ON DELETE SET NULL;
        ', schema_name);
        EXECUTE sql_text;
        RAISE NOTICE 'Added fk_review_tasks_assigned_to to schema: %', schema_name;
    END IF;

    -- 4. exam_scores.graded_by -> public.users.id (nullable)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = schema_name
        AND table_name = 'exam_scores'
        AND constraint_name = 'fk_exam_scores_graded_by'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        sql_text := format('
            ALTER TABLE %I.exam_scores
            ADD CONSTRAINT fk_exam_scores_graded_by
            FOREIGN KEY (graded_by)
            REFERENCES public.users(id)
            ON DELETE SET NULL;
        ', schema_name);
        EXECUTE sql_text;
        RAISE NOTICE 'Added fk_exam_scores_graded_by to schema: %', schema_name;
    END IF;

    -- 5. exam_admins.admin_id -> public.users.id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = schema_name
        AND table_name = 'exam_admins'
        AND constraint_name = 'fk_exam_admins_admin'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        sql_text := format('
            ALTER TABLE %I.exam_admins
            ADD CONSTRAINT fk_exam_admins_admin
            FOREIGN KEY (admin_id)
            REFERENCES public.users(id)
            ON DELETE CASCADE;
        ', schema_name);
        EXECUTE sql_text;
        RAISE NOTICE 'Added fk_exam_admins_admin to schema: %', schema_name;
    END IF;

    -- 6. exam_admins.created_by -> public.users.id (nullable)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = schema_name
        AND table_name = 'exam_admins'
        AND constraint_name = 'fk_exam_admins_created_by'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        sql_text := format('
            ALTER TABLE %I.exam_admins
            ADD CONSTRAINT fk_exam_admins_created_by
            FOREIGN KEY (created_by)
            REFERENCES public.users(id)
            ON DELETE SET NULL;
        ', schema_name);
        EXECUTE sql_text;
        RAISE NOTICE 'Added fk_exam_admins_created_by to schema: %', schema_name;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error processing schema %: %', schema_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 为所有租户schema执行添加外键约束
DO $$
DECLARE
    tenant_schema RECORD;
BEGIN
    FOR tenant_schema IN 
        SELECT schema_name::TEXT
        FROM information_schema.schemata 
        WHERE schema_name LIKE 'tenant_%'
        ORDER BY schema_name
    LOOP
        BEGIN
            RAISE NOTICE 'Processing schema: %', tenant_schema.schema_name;
            PERFORM add_foreign_keys_to_tenant_schema(tenant_schema.schema_name);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to process schema %: %', tenant_schema.schema_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 清理临时函数
DROP FUNCTION IF EXISTS add_foreign_keys_to_tenant_schema(TEXT);

-- 验证：显示所有已添加的外键约束
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema LIKE 'tenant_%'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'users'
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;
