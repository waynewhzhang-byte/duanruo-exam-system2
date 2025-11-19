-- 创建审计日志相关表
-- 此脚本将在每个租户的Schema中执行

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

