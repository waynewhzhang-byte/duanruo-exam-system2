-- 创建用户表（幂等）并插入初始数据（幂等）
-- 目的：允许在数据库已手工创建对象时，仍可安全由 Flyway 执行并登记历史

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    roles TEXT NOT NULL, -- JSON格式存储角色列表（简单起见用TEXT）
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    department VARCHAR(100),
    job_title VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT DEFAULT 0
);

-- 索引（幂等）
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);
-- 使用表达式索引简化角色搜索（示例）
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN (to_tsvector('simple', roles));

-- 初始数据（幂等：按 username 去重）
INSERT INTO users (
    id, username, email, password_hash, full_name, roles, email_verified, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'admin',
    'admin@duanruo.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    '系统管理员',
    '["ADMIN"]',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

INSERT INTO users (
    id, username, email, password_hash, full_name, roles, department, job_title, email_verified, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'primary_reviewer',
    'primary.reviewer@duanruo.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    '张三',
    '["PRIMARY_REVIEWER"]',
    '人力资源部',
    '一级审核员',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

INSERT INTO users (
    id, username, email, password_hash, full_name, roles, department, job_title, email_verified, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'secondary_reviewer',
    'secondary.reviewer@duanruo.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    '李四',
    '["SECONDARY_REVIEWER"]',
    '人力资源部',
    '二级审核员',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

INSERT INTO users (
    id, username, email, password_hash, full_name, phone_number, roles, email_verified, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'candidate_demo',
    'candidate@example.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    '王五',
    '13800138000',
    '["CANDIDATE"]',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

INSERT INTO users (
    id, username, email, password_hash, full_name, roles, department, job_title, email_verified, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'examiner_demo',
    'examiner@duanruo.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    '赵六',
    '["EXAMINER"]',
    '考务部',
    '考官',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- 注释（幂等，重复执行会覆盖为同值，不影响）
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '用户ID';
COMMENT ON COLUMN users.username IS '用户名';
COMMENT ON COLUMN users.email IS '邮箱';
COMMENT ON COLUMN users.password_hash IS '密码哈希';
COMMENT ON COLUMN users.full_name IS '姓名';
COMMENT ON COLUMN users.phone_number IS '手机号';
COMMENT ON COLUMN users.status IS '用户状态：ACTIVE, INACTIVE, LOCKED, PENDING_VERIFICATION, DELETED';
COMMENT ON COLUMN users.roles IS '角色列表（JSON格式）';
COMMENT ON COLUMN users.last_login_at IS '最后登录时间';
COMMENT ON COLUMN users.password_changed_at IS '密码修改时间';
COMMENT ON COLUMN users.email_verified IS '邮箱是否已验证';
COMMENT ON COLUMN users.phone_verified IS '手机是否已验证';
COMMENT ON COLUMN users.department IS '部门';
COMMENT ON COLUMN users.job_title IS '职位';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';
COMMENT ON COLUMN users.version IS '版本号（乐观锁）';
