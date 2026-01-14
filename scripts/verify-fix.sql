-- 验证 tenant_admin_1762476737466 的权限配置

-- 1. 用户信息
SELECT
    '=== 用户信息 ===' AS section,
    id,
    username,
    roles AS global_roles
FROM public.users
WHERE username = 'tenant_admin_1762476737466';

-- 2. 租户角色
SELECT
    '=== 租户角色 ===' AS section,
    utr.id AS role_id,
    t.code AS tenant_code,
    t.name AS tenant_name,
    utr.role AS tenant_role,
    utr.active AS is_active,
    utr.created_at
FROM public.user_tenant_roles utr
JOIN public.users u ON utr.user_id = u.id
JOIN public.tenants t ON utr.tenant_id = t.id
WHERE u.username = 'tenant_admin_1762476737466';

-- 3. 权限验证
SELECT
    '=== 权限验证结果 ===' AS section,
    CASE
        WHEN COUNT(utr.id) > 0 THEN '✅ 用户拥有租户管理员权限'
        ELSE '❌ 用户没有租户管理员权限'
    END AS status
FROM public.user_tenant_roles utr
JOIN public.users u ON utr.user_id = u.id
JOIN public.tenants t ON utr.tenant_id = t.id
WHERE u.username = 'tenant_admin_1762476737466'
  AND t.code = 'test_company_1762456657147'
  AND utr.role = 'TENANT_ADMIN'
  AND utr.active = true;
