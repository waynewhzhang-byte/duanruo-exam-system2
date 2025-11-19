-- 修复用户角色格式
-- 将PostgreSQL数组格式转换为JSON格式

-- 修复 tenant_admin1
UPDATE public.users 
SET roles = '["TENANT_ADMIN"]' 
WHERE username = 'tenant_admin1';

-- 修复 tenant_admin2
UPDATE public.users 
SET roles = '["TENANT_ADMIN"]' 
WHERE username = 'tenant_admin2';

-- 修复 reviewer1_primary
UPDATE public.users 
SET roles = '["PRIMARY_REVIEWER"]' 
WHERE username = 'reviewer1_primary';

-- 修复 reviewer2_secondary
UPDATE public.users 
SET roles = '["SECONDARY_REVIEWER"]' 
WHERE username = 'reviewer2_secondary';

-- 修复 candidate1, candidate2, candidate3
UPDATE public.users 
SET roles = '["CANDIDATE"]' 
WHERE username IN ('candidate1', 'candidate2', 'candidate3');

-- 验证修复结果
SELECT username, roles FROM public.users 
WHERE username IN ('tenant_admin1', 'tenant_admin2', 'reviewer1_primary', 'reviewer2_secondary', 'candidate1');

