-- 删除所有触发器，让Flyway重新创建

-- 删除tenants表的触发器
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;

-- 删除users表的触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- 删除user_tenant_roles表的触发器
DROP TRIGGER IF EXISTS update_user_tenant_roles_updated_at ON public.user_tenant_roles;

-- 显示结果
SELECT 'All triggers dropped successfully' AS status;

