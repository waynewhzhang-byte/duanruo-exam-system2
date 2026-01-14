-- 修复缺少 UserTenantRole 记录的租户管理员
-- 使用前请先运行 check-missing-user-tenant-roles.sql 检查数据

-- 使用说明：
-- 1. 先运行 check-missing-user-tenant-roles.sql 找出缺少 UserTenantRole 的用户
-- 2. 确定每个用户应该属于哪个租户
-- 3. 修改下面的 SQL 语句，填入正确的 user_id 和 tenant_id
-- 4. 执行修复脚本

-- 示例：为指定用户创建 UserTenantRole 记录
-- 替换 'USER_ID_HERE' 和 'TENANT_ID_HERE' 为实际的 UUID

/*
INSERT INTO public.user_tenant_roles (
    id,
    user_id,
    tenant_id,
    role,
    active,
    granted_by,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),                          -- 生成新的 UUID
    'USER_ID_HERE'::uuid,                       -- 替换为用户 UUID
    'TENANT_ID_HERE'::uuid,                     -- 替换为租户 UUID
    'TENANT_ADMIN',                             -- 角色
    true,                                       -- 激活状态
    'USER_ID_HERE'::uuid,                       -- 授予者（暂时使用自己的 ID）
    NOW(),                                      -- 创建时间
    NOW()                                       -- 更新时间
);
*/

-- 批量修复示例（如果有多个用户需要修复）
-- 取消下面的注释并填入正确的值

/*
-- 修复用户 1
INSERT INTO public.user_tenant_roles (id, user_id, tenant_id, role, active, granted_by, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'user_uuid_1'::uuid,
    'tenant_uuid_1'::uuid,
    'TENANT_ADMIN',
    true,
    'user_uuid_1'::uuid,
    NOW(),
    NOW()
);

-- 修复用户 2
INSERT INTO public.user_tenant_roles (id, user_id, tenant_id, role, active, granted_by, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'user_uuid_2'::uuid,
    'tenant_uuid_2'::uuid,
    'TENANT_ADMIN',
    true,
    'user_uuid_2'::uuid,
    NOW(),
    NOW()
);
*/

-- 验证修复结果
-- 运行此查询确认所有租户管理员都有 UserTenantRole 记录
SELECT
    u.id AS user_id,
    u.username,
    u.email,
    u.roles,
    utr.tenant_id,
    utr.role AS tenant_role,
    utr.active AS is_active,
    CASE
        WHEN utr.id IS NULL THEN '❌ 缺少 UserTenantRole 记录'
        ELSE '✅ 已有 UserTenantRole 记录'
    END AS status
FROM public.users u
LEFT JOIN public.user_tenant_roles utr ON u.id = utr.user_id
WHERE u.roles @> ARRAY['TENANT_ADMIN']::varchar[]
ORDER BY u.created_at DESC;
