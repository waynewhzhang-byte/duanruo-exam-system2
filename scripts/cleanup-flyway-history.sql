-- 清理Flyway历史记录
-- 删除已禁用的业务表迁移脚本的记录

DELETE FROM public.flyway_schema_history 
WHERE version IN ('001', '002', '003', '004', '005', '006', '007', '008', '009', '011', '012', '013', '014', '016', '1.11');

-- 查看剩余的迁移记录
SELECT installed_rank, version, description, type, success, installed_on 
FROM public.flyway_schema_history 
ORDER BY installed_rank;

