-- 创建租户相关表（多租户SAAS架构）
-- 版本: V010
-- 描述: 创建租户表和用户-租户-角色关联表

-- 租户表（存储在public schema）
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    schema_name VARCHAR(63) UNIQUE NOT NULL, -- PostgreSQL schema名称限制63字符
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    contact_email VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    CONSTRAINT chk_tenant_status CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE', 'DELETED')),
    CONSTRAINT chk_tenant_code_format CHECK (code ~ '^[a-z0-9_-]+$')
);

-- 用户-租户-角色关联表（存储在public schema）
CREATE TABLE IF NOT EXISTS user_tenant_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID,
    revoked_at TIMESTAMP,
    revoked_by UUID,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_tenant_role CHECK (role IN ('CANDIDATE', 'PRIMARY_REVIEWER', 'SECONDARY_REVIEWER', 'EXAMINER', 'TENANT_ADMIN')),
    CONSTRAINT uq_user_tenant_role UNIQUE (user_id, tenant_id, role)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_schema_name ON tenants(schema_name);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON tenants(created_at);

CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_user_id ON user_tenant_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_tenant_id ON user_tenant_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_user_tenant ON user_tenant_roles(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_active ON user_tenant_roles(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_tenant_roles_role ON user_tenant_roles(role);

-- 创建更新时间触发器
CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE tenants IS '租户表 - 存储SAAS系统的租户信息';
COMMENT ON COLUMN tenants.id IS '租户ID';
COMMENT ON COLUMN tenants.name IS '租户名称';
COMMENT ON COLUMN tenants.code IS '租户唯一标识码';
COMMENT ON COLUMN tenants.schema_name IS '数据库Schema名称';
COMMENT ON COLUMN tenants.status IS '租户状态: PENDING-待激活, ACTIVE-激活, INACTIVE-停用, DELETED-已删除';
COMMENT ON COLUMN tenants.contact_email IS '联系邮箱';
COMMENT ON COLUMN tenants.contact_phone IS '联系电话';
COMMENT ON COLUMN tenants.description IS '租户描述';
COMMENT ON COLUMN tenants.created_at IS '创建时间';
COMMENT ON COLUMN tenants.updated_at IS '更新时间';
COMMENT ON COLUMN tenants.activated_at IS '激活时间';
COMMENT ON COLUMN tenants.deactivated_at IS '停用时间';

COMMENT ON TABLE user_tenant_roles IS '用户-租户-角色关联表 - 用户在不同租户下可以有不同角色';
COMMENT ON COLUMN user_tenant_roles.id IS '关联ID';
COMMENT ON COLUMN user_tenant_roles.user_id IS '用户ID';
COMMENT ON COLUMN user_tenant_roles.tenant_id IS '租户ID';
COMMENT ON COLUMN user_tenant_roles.role IS '角色: CANDIDATE-考生, PRIMARY_REVIEWER-一级审核员, SECONDARY_REVIEWER-二级审核员, EXAMINER-考官, TENANT_ADMIN-租户管理员';
COMMENT ON COLUMN user_tenant_roles.granted_at IS '授权时间';
COMMENT ON COLUMN user_tenant_roles.granted_by IS '授权人ID';
COMMENT ON COLUMN user_tenant_roles.revoked_at IS '撤销时间';
COMMENT ON COLUMN user_tenant_roles.revoked_by IS '撤销人ID';
COMMENT ON COLUMN user_tenant_roles.active IS '是否激活';

-- 插入默认租户（用于现有数据迁移）
INSERT INTO tenants (id, name, code, schema_name, status, contact_email, description, activated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '默认租户',
    'default',
    'public',
    'ACTIVE',
    'admin@duanruo.com',
    '系统默认租户，用于现有数据',
    CURRENT_TIMESTAMP
) ON CONFLICT (code) DO NOTHING;

-- 为现有的管理员用户添加默认租户的TENANT_ADMIN角色
INSERT INTO user_tenant_roles (user_id, tenant_id, role, granted_at, active)
SELECT 
    u.id,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'TENANT_ADMIN',
    CURRENT_TIMESTAMP,
    TRUE
FROM users u
WHERE u.roles LIKE '%ADMIN%'
  AND NOT EXISTS (
      SELECT 1 FROM user_tenant_roles utr 
      WHERE utr.user_id = u.id 
        AND utr.tenant_id = '00000000-0000-0000-0000-000000000001'::UUID
  )
ON CONFLICT (user_id, tenant_id, role) DO NOTHING;

