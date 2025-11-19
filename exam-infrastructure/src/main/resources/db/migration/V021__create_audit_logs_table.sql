-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID,
    user_id UUID,
    username VARCHAR(100),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    required_permission VARCHAR(50),
    result VARCHAR(50) NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    request_method VARCHAR(10),
    request_path VARCHAR(500),
    request_params TEXT,
    response_status VARCHAR(10),
    error_message TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms BIGINT
);

-- 创建索引
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_result ON audit_logs(result);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_tenant_time ON audit_logs(tenant_id, timestamp);
CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, timestamp);

-- 添加表注释
COMMENT ON TABLE audit_logs IS '审计日志表 - 记录所有需要权限控制的操作';
COMMENT ON COLUMN audit_logs.id IS '日志ID';
COMMENT ON COLUMN audit_logs.tenant_id IS '租户ID';
COMMENT ON COLUMN audit_logs.user_id IS '用户ID';
COMMENT ON COLUMN audit_logs.username IS '用户名';
COMMENT ON COLUMN audit_logs.action IS '操作类型';
COMMENT ON COLUMN audit_logs.resource_type IS '资源类型';
COMMENT ON COLUMN audit_logs.resource_id IS '资源ID';
COMMENT ON COLUMN audit_logs.required_permission IS '所需权限';
COMMENT ON COLUMN audit_logs.result IS '操作结果';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP地址';
COMMENT ON COLUMN audit_logs.user_agent IS '用户代理';
COMMENT ON COLUMN audit_logs.request_method IS 'HTTP方法';
COMMENT ON COLUMN audit_logs.request_path IS '请求路径';
COMMENT ON COLUMN audit_logs.request_params IS '请求参数';
COMMENT ON COLUMN audit_logs.response_status IS '响应状态码';
COMMENT ON COLUMN audit_logs.error_message IS '错误信息';
COMMENT ON COLUMN audit_logs.timestamp IS '时间戳';
COMMENT ON COLUMN audit_logs.execution_time_ms IS '执行时间（毫秒）';

