-- 修复考生角色识别问题
-- 问题：考生账户登录后被错误识别为 SUPER_ADMIN

-- 1. 检查考生账户的当前角色配置
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.roles as global_roles,
    u.status
FROM public.users u
WHERE u.username = 'candidate_1762476516042';

-- 2. 检查考生账户的租户角色
SELECT 
    utr.id,
    utr.user_id,
    utr.tenant_id,
    utr.role as tenant_role,
    utr.active,
    t.name as tenant_name,
    t.slug as tenant_slug
FROM public.user_tenant_roles utr
LEFT JOIN public.tenants t ON utr.tenant_id = t.id
WHERE utr.user_id = (SELECT id FROM public.users WHERE username = 'candidate_1762476516042');

-- 3. 确保考生账户只有 CANDIDATE 角色（如果有其他角色，移除）
UPDATE public.users
SET roles = '["CANDIDATE"]'::jsonb
WHERE username = 'candidate_1762476516042'
AND roles::jsonb != '["CANDIDATE"]'::jsonb;

-- 4. 验证修复结果
SELECT 
    u.id,
    u.username,
    u.roles as global_roles,
    COUNT(utr.id) as tenant_role_count
FROM public.users u
LEFT JOIN public.user_tenant_roles utr ON u.id = utr.user_id
WHERE u.username = 'candidate_1762476516042'
GROUP BY u.id, u.username, u.roles;

-- 5. 检查是否有其他考生账户有类似问题
SELECT 
    u.id,
    u.username,
    u.roles,
    u.status
FROM public.users u
WHERE u.roles::jsonb @> '["CANDIDATE"]'::jsonb
AND u.roles::jsonb @> '["SUPER_ADMIN"]'::jsonb;

-- 如果发现有考生同时拥有 SUPER_ADMIN 角色，执行以下修复：
-- UPDATE public.users
-- SET roles = '["CANDIDATE"]'::jsonb
-- WHERE roles::jsonb @> '["CANDIDATE"]'::jsonb
-- AND roles::jsonb @> '["SUPER_ADMIN"]'::jsonb;

