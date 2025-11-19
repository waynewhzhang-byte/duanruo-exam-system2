-- 创建测试数据库脚本
-- 用于集成测试环境

-- 如果数据库已存在，先删除（仅用于测试环境！）
DROP DATABASE IF EXISTS exam_test;

-- 创建测试数据库（使用template0避免排序规则冲突）
CREATE DATABASE exam_test
    WITH
    TEMPLATE = template0
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE exam_test IS '考试报名系统集成测试数据库';

-- 连接到测试数据库
\c exam_test

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 验证扩展已安装
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- 显示数据库信息
SELECT current_database(), current_user, version();

