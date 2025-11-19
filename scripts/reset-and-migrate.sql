-- 重置Flyway历史并让Flyway重新执行迁移

-- 1. 清空flyway_schema_history表
TRUNCATE TABLE public.flyway_schema_history;

-- 2. 不插入任何记录，让Flyway自动执行所有迁移脚本

-- 显示结果
SELECT 'Flyway history cleared. Ready for fresh migration.' AS status;

