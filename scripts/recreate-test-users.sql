-- 删除并重新创建所有测试用户
-- 使用与admin完全相同的password_hash

-- 1. 删除旧数据
DELETE FROM public.user_tenant_roles WHERE user_id IN (
    SELECT id FROM public.users WHERE username IN (
        'tenant_admin1', 'tenant_admin2', 
        'reviewer1_primary', 'reviewer2_secondary',
        'candidate1', 'candidate2', 'candidate3'
    )
);

DELETE FROM public.users WHERE username IN (
    'tenant_admin1', 'tenant_admin2', 
    'reviewer1_primary', 'reviewer2_secondary',
    'candidate1', 'candidate2', 'candidate3'
);

-- 2. 重新创建用户（使用admin的password_hash）
INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'tenant_admin1',
    password_hash,
    'admin1@hr-city.com',
    '租户管理员1',
    '13800138002',
    'ACTIVE',
    ARRAY['TENANT_ADMIN']::varchar[],
    NOW(),
    NOW()
FROM public.users WHERE username = 'admin';

INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
SELECT 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'tenant_admin2',
    password_hash,
    'admin2@edu-province.com',
    '租户管理员2',
    '13900139002',
    'ACTIVE',
    ARRAY['TENANT_ADMIN']::varchar[],
    NOW(),
    NOW()
FROM public.users WHERE username = 'admin';

INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
SELECT 
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
    'reviewer1_primary',
    password_hash,
    'reviewer1@hr-city.com',
    '一级审核员1',
    '13800138003',
    'ACTIVE',
    ARRAY['PRIMARY_REVIEWER']::varchar[],
    NOW(),
    NOW()
FROM public.users WHERE username = 'admin';

INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
SELECT 
    'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
    'reviewer2_secondary',
    password_hash,
    'reviewer2@hr-city.com',
    '二级审核员2',
    '13800138004',
    'ACTIVE',
    ARRAY['SECONDARY_REVIEWER']::varchar[],
    NOW(),
    NOW()
FROM public.users WHERE username = 'admin';

INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
SELECT 
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid,
    'candidate1',
    password_hash,
    'candidate1@example.com',
    '考生张三',
    '13700137001',
    'ACTIVE',
    ARRAY['CANDIDATE']::varchar[],
    NOW(),
    NOW()
FROM public.users WHERE username = 'admin';

INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
SELECT 
    'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
    'candidate2',
    password_hash,
    'candidate2@example.com',
    '考生李四',
    '13700137002',
    'ACTIVE',
    ARRAY['CANDIDATE']::varchar[],
    NOW(),
    NOW()
FROM public.users WHERE username = 'admin';

INSERT INTO public.users (id, username, password_hash, email, full_name, phone_number, status, roles, created_at, updated_at)
SELECT 
    '99999999-9999-9999-9999-999999999999'::uuid,
    'candidate3',
    password_hash,
    'candidate3@example.com',
    '考生王五',
    '13700137003',
    'ACTIVE',
    ARRAY['CANDIDATE']::varchar[],
    NOW(),
    NOW()
FROM public.users WHERE username = 'admin';

-- 3. 重新关联租户
INSERT INTO public.user_tenant_roles (id, user_id, tenant_id, role, granted_at, active)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'TENANT_ADMIN', NOW(), true),
    ('cccccccc-cccc-cccc-cccc-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'PRIMARY_REVIEWER', NOW(), true),
    ('dddddddd-dddd-dddd-dddd-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'SECONDARY_REVIEWER', NOW(), true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'TENANT_ADMIN', NOW(), true);

-- 4. 验证
SELECT '=== 验证密码hash长度 ===' AS info;
SELECT username, LENGTH(password_hash) as hash_length
FROM public.users 
WHERE username IN ('admin', 'tenant_admin1', 'candidate1')
ORDER BY username;

SELECT '=== 验证密码hash内容 ===' AS info;
SELECT username, 
       CASE 
           WHEN password_hash = (SELECT password_hash FROM public.users WHERE username = 'admin') THEN '✓ 与admin相同'
           ELSE '✗ 不同'
       END AS hash_status
FROM public.users 
WHERE username IN ('admin', 'tenant_admin1', 'tenant_admin2', 'reviewer1_primary', 'reviewer2_secondary', 'candidate1', 'candidate2', 'candidate3')
ORDER BY username;

