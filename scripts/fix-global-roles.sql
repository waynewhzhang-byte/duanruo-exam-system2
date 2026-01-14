-- 修复用户全局角色问题
-- 只有SUPER_ADMIN应该有全局角色,其他用户的角色应该只在租户级别分配

-- 1. 查看当前有全局CANDIDATE角色的用户
SELECT 
    u.id,
    u.username,
    u.email,
    u.roles as global_roles,
    COUNT(utr.id) as tenant_role_count
FROM users u
LEFT JOIN user_tenant_roles utr ON u.id = utr.user_id
WHERE u.roles::text LIKE '%CANDIDATE%'
GROUP BY u.id, u.username, u.email, u.roles;

-- 2. 清除非SUPER_ADMIN用户的全局CANDIDATE角色
-- 保留SUPER_ADMIN的全局角色
UPDATE users
SET roles = '[]'::jsonb
WHERE roles::text LIKE '%CANDIDATE%'
  AND roles::text NOT LIKE '%SUPER_ADMIN%';

-- 3. 验证修复结果
SELECT 
    u.id,
    u.username,
    u.email,
    u.roles as global_roles,
    array_agg(utr.role) as tenant_roles
FROM users u
LEFT JOIN user_tenant_roles utr ON u.id = utr.user_id
GROUP BY u.id, u.username, u.email, u.roles
ORDER BY u.username;
