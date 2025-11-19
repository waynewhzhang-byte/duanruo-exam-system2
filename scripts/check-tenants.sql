-- 检查租户数据
SELECT 
    id,
    name,
    code,
    schema_name,
    status,
    contact_email,
    contact_phone,
    description,
    created_at,
    updated_at,
    activated_at,
    deactivated_at
FROM public.tenants
ORDER BY created_at DESC;

-- 统计租户数量
SELECT 
    status,
    COUNT(*) as count
FROM public.tenants
GROUP BY status;

-- 检查是否有激活的租户
SELECT COUNT(*) as active_tenant_count
FROM public.tenants
WHERE status = 'ACTIVE';

