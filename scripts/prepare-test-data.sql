-- ============================================
-- 多租户考试报名系统 - 测试数据准备脚本
-- 用于API权限测试
-- ============================================

-- 清理现有测试数据（保留系统管理员）
-- DELETE FROM public.user_tenant_roles WHERE user_id != 'be7eb95c-25e2-4054-84b9-86ac5f4309eb';
-- DELETE FROM public.users WHERE id != 'be7eb95c-25e2-4054-84b9-86ac5f4309eb';

-- ============================================
-- 1. 创建测试租户
-- ============================================

-- 租户1: 某市人力资源局
INSERT INTO public.tenants (id, name, code, schema_name, status, contact_email, contact_phone, description, created_at, updated_at, activated_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', '某市人力资源局', 'hr_city', 'tenant_11111111_1111_1111_1111_111111111111', 'ACTIVE', 'zhang@hr-city.com', '13800138001', '某市人力资源局考试管理系统', NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    status = EXCLUDED.status;

-- 租户2: 某省教育厅
INSERT INTO public.tenants (id, name, code, schema_name, status, contact_email, contact_phone, description, created_at, updated_at, activated_at)
VALUES
    ('22222222-2222-2222-2222-222222222222', '某省教育厅', 'edu_province', 'tenant_22222222_2222_2222_2222_222222222222', 'ACTIVE', 'li@edu-province.com', '13900139001', '某省教育厅考试管理系统', NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    status = EXCLUDED.status;

-- ============================================
-- 2. 创建测试用户（不同角色）
-- ============================================

-- 2.1 租户管理员 (TENANT_ADMIN) - 租户1
INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'tenant_admin1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin1@hr-city.com', '租户管理员1', '13800138002', 'ACTIVE', ARRAY['TENANT_ADMIN']::varchar[], NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- 关联租户1
INSERT INTO public.user_tenant_roles (id, user_id, tenant_id, role, granted_at, active)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'TENANT_ADMIN', NOW(), true)
ON CONFLICT (id) DO NOTHING;

-- 2.2 租户管理员 (TENANT_ADMIN) - 租户2
INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
VALUES 
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'tenant_admin2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin2@edu-province.com', '租户管理员2', '13900139002', 'ACTIVE', ARRAY['TENANT_ADMIN']::varchar[], NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- 关联租户2
INSERT INTO public.user_tenant_roles (id, user_id, tenant_id, role, granted_at, active)
VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'TENANT_ADMIN', NOW(), true)
ON CONFLICT (id) DO NOTHING;

-- 2.3 一级审核员 (PRIMARY_REVIEWER) - 租户1
INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'reviewer1_primary', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'reviewer1@hr-city.com', '一级审核员1', '13800138003', 'ACTIVE', ARRAY['PRIMARY_REVIEWER']::varchar[], NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- 关联租户1
INSERT INTO public.user_tenant_roles (id, user_id, tenant_id, role, granted_at, active)
VALUES
    ('cccccccc-cccc-cccc-cccc-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'PRIMARY_REVIEWER', NOW(), true)
ON CONFLICT (id) DO NOTHING;

-- 2.4 二级审核员 (SECONDARY_REVIEWER) - 租户1
INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'reviewer2_secondary', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'reviewer2@hr-city.com', '二级审核员1', '13800138004', 'ACTIVE', ARRAY['SECONDARY_REVIEWER']::varchar[], NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- 关联租户1
INSERT INTO public.user_tenant_roles (id, user_id, tenant_id, role, granted_at, active)
VALUES
    ('dddddddd-dddd-dddd-dddd-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'SECONDARY_REVIEWER', NOW(), true)
ON CONFLICT (id) DO NOTHING;

-- 2.5 考生 (CANDIDATE) - 3个考生
INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
VALUES 
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'candidate1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'candidate1@example.com', '张三', '13800138005', 'ACTIVE', ARRAY['CANDIDATE']::varchar[], NOW(), NOW()),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'candidate2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'candidate2@example.com', '李四', '13800138006', 'ACTIVE', ARRAY['CANDIDATE']::varchar[], NOW(), NOW()),
    ('99999999-9999-9999-9999-999999999999', 'candidate3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'candidate3@example.com', '王五', '13800138007', 'ACTIVE', ARRAY['CANDIDATE']::varchar[], NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- ============================================
-- 3. 创建租户Schema（如果不存在）
-- ============================================

-- 为租户1创建Schema
CREATE SCHEMA IF NOT EXISTS tenant_11111111_1111_1111_1111_111111111111;

-- 为租户2创建Schema
CREATE SCHEMA IF NOT EXISTS tenant_22222222_2222_2222_2222_222222222222;

-- ============================================
-- 说明
-- ============================================

-- 所有用户的密码都是: admin123@Abc (BCrypt加密后的hash)
-- 
-- 用户列表:
-- 1. admin (SUPER_ADMIN) - 系统超级管理员
-- 2. tenant_admin1 (TENANT_ADMIN) - 租户1管理员
-- 3. tenant_admin2 (TENANT_ADMIN) - 租户2管理员
-- 4. reviewer1_primary (PRIMARY_REVIEWER) - 租户1一级审核员
-- 5. reviewer2_secondary (SECONDARY_REVIEWER) - 租户1二级审核员
-- 6. candidate1, candidate2, candidate3 (CANDIDATE) - 考生
--
-- 租户列表:
-- 1. 某市人力资源局 (11111111-1111-1111-1111-111111111111)
-- 2. 某省教育厅 (22222222-2222-2222-2222-222222222222)

-- 查询验证
SELECT 'Users' as type, username, full_name, roles FROM public.users ORDER BY created_at;
SELECT 'Tenants' as type, name, domain, status FROM public.tenants ORDER BY created_at;
SELECT 'User-Tenant Roles' as type, u.username, t.name as tenant_name, utr.role 
FROM public.user_tenant_roles utr
JOIN public.users u ON utr.user_id = u.id
JOIN public.tenants t ON utr.tenant_id = t.id
ORDER BY u.username;

