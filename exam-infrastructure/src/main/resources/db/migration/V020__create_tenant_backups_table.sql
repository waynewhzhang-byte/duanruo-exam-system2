-- V020: 创建租户备份表
-- 描述: 用于存储租户数据备份的元数据和状态信息

-- 租户备份表（存储在public schema）
CREATE TABLE IF NOT EXISTS tenant_backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    backup_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    backup_path VARCHAR(500),
    backup_size BIGINT,
    checksum VARCHAR(64),
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    error_message VARCHAR(1000),
    
    -- 备份元数据
    tenant_name VARCHAR(100),
    schema_name VARCHAR(63),
    table_count INTEGER,
    record_count BIGINT,
    database_version VARCHAR(50),
    application_version VARCHAR(50),
    
    -- 审计字段
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT chk_backup_type CHECK (backup_type IN ('FULL', 'INCREMENTAL', 'MANUAL')),
    CONSTRAINT chk_backup_status CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tenant_backups_tenant_id ON tenant_backups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_backups_status ON tenant_backups(status);
CREATE INDEX IF NOT EXISTS idx_tenant_backups_started_at ON tenant_backups(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_backups_tenant_started ON tenant_backups(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_backups_completed_at ON tenant_backups(completed_at DESC) 
    WHERE completed_at IS NOT NULL;

-- 创建更新时间触发器
CREATE TRIGGER update_tenant_backups_updated_at 
    BEFORE UPDATE ON tenant_backups
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE tenant_backups IS '租户备份表 - 存储租户数据备份的元数据';
COMMENT ON COLUMN tenant_backups.id IS '备份ID';
COMMENT ON COLUMN tenant_backups.tenant_id IS '租户ID';
COMMENT ON COLUMN tenant_backups.backup_type IS '备份类型: FULL-全量, INCREMENTAL-增量, MANUAL-手动';
COMMENT ON COLUMN tenant_backups.status IS '备份状态: IN_PROGRESS-进行中, COMPLETED-已完成, FAILED-失败, EXPIRED-已过期';
COMMENT ON COLUMN tenant_backups.backup_path IS '备份文件路径';
COMMENT ON COLUMN tenant_backups.backup_size IS '备份文件大小（字节）';
COMMENT ON COLUMN tenant_backups.checksum IS '备份文件校验和（SHA-256）';
COMMENT ON COLUMN tenant_backups.started_at IS '备份开始时间';
COMMENT ON COLUMN tenant_backups.completed_at IS '备份完成时间';
COMMENT ON COLUMN tenant_backups.error_message IS '错误信息';
COMMENT ON COLUMN tenant_backups.tenant_name IS '租户名称（快照）';
COMMENT ON COLUMN tenant_backups.schema_name IS 'Schema名称（快照）';
COMMENT ON COLUMN tenant_backups.table_count IS '备份的表数量';
COMMENT ON COLUMN tenant_backups.record_count IS '备份的记录总数';
COMMENT ON COLUMN tenant_backups.database_version IS '数据库版本';
COMMENT ON COLUMN tenant_backups.application_version IS '应用版本';
COMMENT ON COLUMN tenant_backups.created_at IS '创建时间';
COMMENT ON COLUMN tenant_backups.updated_at IS '更新时间';

