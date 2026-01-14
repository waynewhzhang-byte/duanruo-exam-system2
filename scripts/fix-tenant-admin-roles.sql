-- 修复租户管理员角色问题
-- 确保所有租户管理员在 user_tenant_roles 表中有正确的记录

-- 1. 查看当前 duanruotest1 用户的状态
SELECT 
    u.id as user_id,
    u.username,
    u.roles as global_roles,
    utr.id as user_tenant_role_id,
    utr.tenant_id,
    utr.role as tenant_role,
    utr.is_active,
    t.name as tenant_name
FROM users u
LEFT JOIN user_tenant_roles utr ON u.id = utr.user_id AND utr.is_active = true
LEFT JOIN tenants t ON utr.tenant_id = t.id
WHERE u.username = 'duanruotest1';

-- 2. 如果没有租户角色记录，需要手动创建
-- 首先获取用户ID和租户ID
-- 假设租户名称是 "端若数智" 或根据实际情况调整

-- 示例：为 duanruotest1 创建 TENANT_ADMIN 角色
-- 注意：需要替换实际的 tenant_id

/*
INSERT INTO user_tenant_roles (
    id,
    user_id,
    tenant_id,
    role,
    granted_at,
    granted_by,
    is_active
)
SELECT 
    gen_random_uuid(),
    u.id,
    t.id,
    'TENANT_ADMIN',
    NOW(),
    u.id,  -- 自己授予自己
    true
FROM users u
CROSS JOIN tenants t
WHERE u.username = 'duanruotest1'
  AND t.code = 'duanruo'  -- 替换为实际的租户code
  AND NOT EXISTS (
      SELECT 1 FROM user_tenant_roles utr
      WHERE utr.user_id = u.id
        AND utr.tenant_id = t.id
        AND utr.role = 'TENANT_ADMIN'
  );
*/

-- 3. 如果租户角色存在但 is_active = false，激活它
/*
UPDATE user_tenant_roles
SET is_active = true,
    granted_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE username = 'duanruotest1')
  AND role = 'TENANT_ADMIN'
  AND is_active = false;
*/

-- 4. 验证修复结果
SELECT 
    u.id as user_id,
    u.username,
    u.roles as global_roles,
    utr.id as user_tenant_role_id,
    utr.tenant_id,
    utr.role as tenant_role,
    utr.is_active,
    t.name as tenant_name,
    t.code as tenant_code
FROM users u
LEFT JOIN user_tenant_roles utr ON u.id = utr.user_id
LEFT JOIN tenants t ON utr.tenant_id = t.id
WHERE u.username = 'duanruotest1';

