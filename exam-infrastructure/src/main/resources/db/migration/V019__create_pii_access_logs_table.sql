-- V019: 创建PII访问日志表
-- 用于记录敏感数据访问情况，满足合规审计要求

-- 创建PII访问日志表
CREATE TABLE IF NOT EXISTS pii_access_logs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    username VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    access_type VARCHAR(20) NOT NULL,
    accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    source VARCHAR(50),
    masked BOOLEAN NOT NULL DEFAULT TRUE,
    purpose VARCHAR(500)
);

-- 添加注释
COMMENT ON TABLE pii_access_logs IS 'PII（个人身份信息）访问审计日志表';
COMMENT ON COLUMN pii_access_logs.id IS '日志ID';
COMMENT ON COLUMN pii_access_logs.user_id IS '访问者用户ID';
COMMENT ON COLUMN pii_access_logs.username IS '访问者用户名';
COMMENT ON COLUMN pii_access_logs.user_role IS '访问者角色';
COMMENT ON COLUMN pii_access_logs.resource_type IS '访问的资源类型（如：Application, User, Candidate等）';
COMMENT ON COLUMN pii_access_logs.resource_id IS '访问的资源ID';
COMMENT ON COLUMN pii_access_logs.field_name IS '访问的PII字段名称';
COMMENT ON COLUMN pii_access_logs.field_type IS 'PII字段类型（NAME, ID_CARD, PHONE, EMAIL等）';
COMMENT ON COLUMN pii_access_logs.access_type IS '访问操作类型（READ, EXPORT, DOWNLOAD, PRINT, UPDATE, DELETE）';
COMMENT ON COLUMN pii_access_logs.accessed_at IS '访问时间';
COMMENT ON COLUMN pii_access_logs.ip_address IS '访问来源IP地址';
COMMENT ON COLUMN pii_access_logs.source IS '访问来源（WEB, API, MOBILE等）';
COMMENT ON COLUMN pii_access_logs.masked IS '是否脱敏访问';
COMMENT ON COLUMN pii_access_logs.purpose IS '访问原因/目的';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_pii_access_logs_user_id ON pii_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pii_access_logs_resource ON pii_access_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_pii_access_logs_accessed_at ON pii_access_logs(accessed_at);
CREATE INDEX IF NOT EXISTS idx_pii_access_logs_access_type ON pii_access_logs(access_type);
CREATE INDEX IF NOT EXISTS idx_pii_access_logs_user_time ON pii_access_logs(user_id, accessed_at);

-- 添加索引注释
COMMENT ON INDEX idx_pii_access_logs_user_id IS '用户ID索引，用于查询特定用户的访问记录';
COMMENT ON INDEX idx_pii_access_logs_resource IS '资源复合索引，用于查询特定资源的访问记录';
COMMENT ON INDEX idx_pii_access_logs_accessed_at IS '访问时间索引，用于按时间范围查询';
COMMENT ON INDEX idx_pii_access_logs_access_type IS '访问类型索引，用于按操作类型查询';
COMMENT ON INDEX idx_pii_access_logs_user_time IS '用户时间复合索引，用于查询特定用户在特定时间范围的访问记录';

