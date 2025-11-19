-- 修复租户邮箱地址（将下划线替换为连字符）
-- 这样可以符合标准的邮箱格式

UPDATE public.tenants
SET contact_email = 'contact@company-a.com'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE public.tenants
SET contact_email = 'contact@company-b.com'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- 验证更新结果
SELECT id, name, slug, contact_email
FROM public.tenants
ORDER BY created_at;

