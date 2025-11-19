-- 检查默认租户的schema
SELECT schema_name 
FROM public.tenants 
WHERE slug = 'default';

-- 检查默认租户schema中的考试数据
-- 假设schema名称是tenant_default
SELECT * FROM tenant_default.exams LIMIT 10;

-- 如果上面的查询失败，尝试查找所有schema
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';

