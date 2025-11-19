-- 创建审核管理相关表
-- 此脚本将在每个租户的Schema中执行

-- 审核任务表
CREATE TABLE IF NOT EXISTS review_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    stage VARCHAR(32) NOT NULL,  -- PRIMARY, SECONDARY
    status VARCHAR(32) NOT NULL,  -- OPEN, ASSIGNED, COMPLETED, CANCELLED
    assigned_to UUID,
    locked_at TIMESTAMP,
    last_heartbeat_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_tasks_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_tasks_app_stage ON review_tasks(application_id, stage);
CREATE INDEX IF NOT EXISTS idx_review_tasks_assigned_status ON review_tasks(assigned_to, status);

-- 考试审核员表
CREATE TABLE IF NOT EXISTS exam_reviewers (
    id BIGSERIAL PRIMARY KEY,
    exam_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,
    stage VARCHAR(32) NOT NULL,  -- PRIMARY, SECONDARY
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exam_reviewers_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT uk_exam_reviewer_stage UNIQUE (exam_id, reviewer_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_exam_reviewers_exam ON exam_reviewers(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_reviewers_reviewer ON exam_reviewers(reviewer_id);

-- 考试管理员表
CREATE TABLE IF NOT EXISTS exam_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL,
    admin_id UUID NOT NULL,
    permissions JSONB,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exam_admins_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT uq_exam_admin UNIQUE (exam_id, admin_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_admins_exam_id ON exam_admins(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_admins_admin_id ON exam_admins(admin_id);
CREATE INDEX IF NOT EXISTS idx_exam_admins_created_by ON exam_admins(created_by);

