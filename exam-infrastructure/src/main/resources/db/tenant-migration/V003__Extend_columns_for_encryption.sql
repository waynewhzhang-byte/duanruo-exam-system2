-- V003: 扩展租户 schema 的敏感字段列长度以支持加密存储
-- 本脚本会在创建新租户时自动执行

-- ============================================
-- 扩展 tickets 表的敏感字段
-- ============================================

ALTER TABLE tickets
    ALTER COLUMN candidate_name TYPE VARCHAR(500),
    ALTER COLUMN candidate_id_number TYPE VARCHAR(500);

COMMENT ON COLUMN tickets.candidate_name IS '考生姓名（AES加密存储）';
COMMENT ON COLUMN tickets.candidate_id_number IS '考生身份证号（AES加密存储）';

-- ============================================
-- 说明
-- ============================================

-- 1. 本迁移脚本扩展了以下敏感字段的列长度：
--    - tickets: candidate_name (100 -> 500)
--    - tickets: candidate_id_number (50 -> 500)
--
-- 2. 加密后的数据长度：
--    - AES-256-CBC 加密后的数据长度约为原始长度的 2 倍
--    - 设置为 500 可以支持最长约 300 字符的原始数据
--
-- 3. 注意事项：
--    - 本脚本会在创建新租户时自动执行
--    - 现有租户的数据迁移由 V015 脚本处理


