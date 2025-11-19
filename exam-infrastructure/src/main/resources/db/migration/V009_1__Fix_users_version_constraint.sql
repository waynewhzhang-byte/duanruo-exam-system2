-- 修复users表的version字段约束，确保JPA乐观锁正常工作
-- 
-- 问题：users表的version字段允许NULL，导致Hibernate乐观锁失败
-- 解决：添加NOT NULL约束并设置默认值

-- 修复users表的version字段
UPDATE users SET version = 0 WHERE version IS NULL;
ALTER TABLE users ALTER COLUMN version SET NOT NULL;
ALTER TABLE users ALTER COLUMN version SET DEFAULT 0;

-- 添加注释说明
COMMENT ON COLUMN users.version IS 'JPA乐观锁版本号，必须非NULL';

