-- V013: 在考试级别添加报名表单模板字段
-- 原因: 一个考试只有一个报名表单,应该在考试级别而不是岗位级别

-- 1. 在exams表中添加form_template字段
ALTER TABLE exams ADD COLUMN IF NOT EXISTS form_template JSONB;

-- 2. 添加注释
COMMENT ON COLUMN exams.form_template IS '考试报名表单模板(JSON格式),一个考试只有一个报名表单';

-- 注意: positions表从未有过form_template字段,所以不需要迁移数据

