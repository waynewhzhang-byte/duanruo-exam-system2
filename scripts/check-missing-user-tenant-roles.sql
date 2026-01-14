-- 检查缺少 UserTenantRole 记录的租户管理员
-- 这个脚本会找出所有在 users 表中有 TENANT_ADMIN 角色但在 user_tenant_roles 表中没有对应记录的用户

-- 查看所有租户
SELECT
    id AS tenant_id,
    code AS tenant_code,
    name AS tenant_name,
    active AS is_active
FROM public.tenants
ORDER BY created_at DESC;

-- 查看所有用户及其角色
SELECT
    id AS user_id,
    username,
    email,
    full_name,
    roles,
    status,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- 查看所有 user_tenant_roles 记录
SELECT
    id,
    user_id,
    tenant_id,
    role,
    active,
    created_at
FROM public.user_tenant_roles
ORDER BY created_at DESC;

-- 查找在 users 表中有 TENANT_ADMIN 角色但在 user_tenant_roles 表中没有对应记录的用户
SELECT
    u.id AS user_id,
    u.username,
    u.email,
    u.full_name,
    u.roles,
    CASE
        WHEN utr.id IS NULL THEN '缺少 UserTenantRole 记录'
        ELSE '已有 UserTenantRole 记录'
    END AS status
FROM public.users u
LEFT JOIN public.user_tenant_roles utr ON u.id = utr.user_id
WHERE u.roles @> ARRAY['TENANT_ADMIN']::varchar[]
ORDER BY u.created_at DESC;

-- 统计信息
SELECT
    '总用户数' AS metric,
    COUNT(*) AS count
FROM public.users
UNION ALL
SELECT
    '租户管理员数' AS metric,
    COUNT(*) AS count
FROM public.users
WHERE roles @> ARRAY['TENANT_ADMIN']::varchar[]
UNION ALL
SELECT
    'UserTenantRole 记录数' AS metric,
    COUNT(*) AS count
FROM public.user_tenant_roles
UNION ALL
SELECT
    '缺少 UserTenantRole 的租户管理员数' AS metric,
    COUNT(DISTINCT u.id) AS count
FROM public.users u
LEFT JOIN public.user_tenant_roles utr ON u.id = utr.user_id
WHERE u.roles @> ARRAY['TENANT_ADMIN']::varchar[]
  AND utr.id IS NULL;
