-- V014: 添加applications表的candidate_id外键约束
-- 目的：确保candidate_id引用有效的全局用户，提高数据完整性

-- 添加外键约束：applications.candidate_id -> public.users.id
-- 注意：这是跨schema的外键约束（从租户schema到public schema）
-- 使用DO块检查约束是否已存在，避免重复添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_applications_candidate'
          AND conrelid = 'applications'::regclass
    ) THEN
        ALTER TABLE applications
        ADD CONSTRAINT fk_applications_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE;

        -- 添加注释
        COMMENT ON CONSTRAINT fk_applications_candidate ON applications IS
        '外键约束：确保candidate_id引用有效的全局用户。当用户被删除时，相关报名记录也会被级联删除。';
    END IF;
END $$;

