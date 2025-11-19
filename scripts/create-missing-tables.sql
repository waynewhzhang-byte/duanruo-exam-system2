-- 在租户schema中创建缺失的表
SET search_path TO tenant_test_company_a, public;

-- 审核任务表
CREATE TABLE IF NOT EXISTS review_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    stage VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
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
    stage VARCHAR(32) NOT NULL,
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

-- 考试成绩表
CREATE TABLE IF NOT EXISTS exam_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    is_absent BOOLEAN NOT NULL DEFAULT FALSE,
    graded_by UUID,
    graded_at TIMESTAMP,
    remarks TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exam_scores_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_scores_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT uq_application_subject UNIQUE (application_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_scores_application_id ON exam_scores(application_id);
CREATE INDEX IF NOT EXISTS idx_exam_scores_subject_id ON exam_scores(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_scores_graded_by ON exam_scores(graded_by);
CREATE INDEX IF NOT EXISTS idx_exam_scores_graded_at ON exam_scores(graded_at);
CREATE INDEX IF NOT EXISTS idx_exam_scores_score ON exam_scores(score);

-- 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    out_trade_no VARCHAR(64) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(128),
    payment_params TEXT,
    callback_data TEXT,
    failure_reason VARCHAR(500),
    paid_at TIMESTAMP,
    expired_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_orders_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_out_trade_no ON payment_orders(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_payment_orders_application_id ON payment_orders(application_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_transaction_id ON payment_orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at);

-- 准考证号规则表
CREATE TABLE IF NOT EXISTS ticket_number_rules (
    exam_id UUID PRIMARY KEY,
    custom_prefix VARCHAR(50),
    include_exam_code BOOLEAN NOT NULL DEFAULT TRUE,
    include_position_code BOOLEAN NOT NULL DEFAULT TRUE,
    date_format VARCHAR(20) NOT NULL DEFAULT 'YYYYMMDD',
    sequence_length INTEGER NOT NULL,
    sequence_start INTEGER NOT NULL,
    daily_reset BOOLEAN NOT NULL,
    checksum_type VARCHAR(20) NOT NULL,
    separator VARCHAR(10) NOT NULL DEFAULT '-',
    include_date BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_number_rules_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 准考证号序列表
CREATE TABLE IF NOT EXISTS ticket_sequences (
    exam_id UUID NOT NULL,
    scope VARCHAR(16) NOT NULL,
    counter_date DATE NOT NULL,
    current_value BIGINT NOT NULL,
    PRIMARY KEY (exam_id, scope, counter_date),
    CONSTRAINT fk_ticket_sequences_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 报名申请审计日志表
CREATE TABLE IF NOT EXISTS application_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    actor VARCHAR(100),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_application_audit_logs_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_application_audit_logs_application_id ON application_audit_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_application_audit_logs_created_at ON application_audit_logs(created_at);

