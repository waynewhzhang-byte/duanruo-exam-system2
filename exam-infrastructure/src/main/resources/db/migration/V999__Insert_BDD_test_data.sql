-- BDD测试数据
-- 此脚本仅在开发环境执行，用于BDD测试

-- 清理旧的测试数据（如果存在）
-- 删除使用相同phone_number或email的用户
DELETE FROM public.user_tenant_roles WHERE user_id IN (
    SELECT id FROM public.users WHERE
        username IN ('super_admin', 'tenant_admin', 'bdd_reviewer1', 'bdd_reviewer2', 'tenant_admin1', 'reviewer1_primary', 'reviewer2_secondary', 'bdd_candidate')
        OR phone_number IN ('13800138000', '13800138002', '13800138003', '13800138004', '13800138005')
        OR email IN ('super_admin@system.com', 'tenant_admin@test-company.com', 'reviewer1@test-company.com', 'reviewer2@test-company.com', 'candidate@test-company.com')
);
DELETE FROM public.users WHERE
    username IN ('super_admin', 'tenant_admin', 'bdd_reviewer1', 'bdd_reviewer2', 'tenant_admin1', 'reviewer1_primary', 'reviewer2_secondary', 'bdd_candidate')
    OR phone_number IN ('13800138000', '13800138002', '13800138003', '13800138004', '13800138005')
    OR email IN ('super_admin@system.com', 'tenant_admin@test-company.com', 'reviewer1@test-company.com', 'reviewer2@test-company.com', 'candidate@test-company.com');

-- 插入超级管理员用户（全局用户，不属于任何租户）
-- 密码: SuperAdmin123!@# (BCrypt加密)
INSERT INTO public.users (id, username, password_hash, email, phone_number, full_name, roles, status, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'super_admin',
    '$2a$10$IJn3H1W5rHcOBA677AcVI.lPWCV7TBY09PBKvn6Zah6qlBZOSMeUO', -- SuperAdmin123!@#
    'super_admin@system.com',
    '13800138000',
    '超级管理员',
    '["SUPER_ADMIN"]',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    email = EXCLUDED.email,
    phone_number = EXCLUDED.phone_number,
    full_name = EXCLUDED.full_name,
    roles = EXCLUDED.roles,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- 插入测试租户（如果不存在）
INSERT INTO public.tenants (id, name, code, schema_name, contact_email, contact_phone, status, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '测试企业A',
    'test-company-a',
    'tenant_test_company_a',
    'zhang@test-a.com',
    '13800138001',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    schema_name = EXCLUDED.schema_name,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- 插入租户管理员用户
-- 密码: TenantAdmin123!@# (BCrypt加密)
INSERT INTO public.users (id, username, password_hash, email, phone_number, full_name, roles, status, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'tenant_admin',
    '$2a$10$IJn3H1W5rHcOBA677AcVI.lPWCV7TBY09PBKvn6Zah6qlBZOSMeUO', -- TenantAdmin123!@#
    'tenant_admin@test-company.com',
    '13800138002',
    '租户管理员',
    '["TENANT_ADMIN"]',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 插入一级审核员用户
-- 密码: Reviewer123!@#
INSERT INTO public.users (id, username, password_hash, email, phone_number, full_name, roles, status, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000003'::uuid,
    'bdd_reviewer1',
    '$2a$10$PjxMIWrdRD.9SDxNcfjTy.50oO27ari3k.fIzsDJN.S5AVbGBIRQq', -- Reviewer123!@#
    'reviewer1@test-company.com',
    '13800138003',
    '一级审核员',
    '["PRIMARY_REVIEWER"]',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 插入二级审核员用户
-- 密码: Reviewer123!@#
INSERT INTO public.users (id, username, password_hash, email, phone_number, full_name, roles, status, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000004'::uuid,
    'bdd_reviewer2',
    '$2a$10$PjxMIWrdRD.9SDxNcfjTy.50oO27ari3k.fIzsDJN.S5AVbGBIRQq', -- Reviewer123!@#
    'reviewer2@test-company.com',
    '13800138004',
    '二级审核员',
    '["SECONDARY_REVIEWER"]',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 插入用户-租户-角色关联（租户管理员）
INSERT INTO public.user_tenant_roles (id, user_id, tenant_id, role, granted_at)
VALUES (
    '00000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'TENANT_ADMIN',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- 插入用户-租户-角色关联（一级审核员）
INSERT INTO public.user_tenant_roles (id, user_id, tenant_id, role, granted_at)
VALUES (
    '00000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'PRIMARY_REVIEWER',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- 插入用户-租户-角色关联（二级审核员）
INSERT INTO public.user_tenant_roles (id, user_id, tenant_id, role, granted_at)
VALUES (
    '00000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'SECONDARY_REVIEWER',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- 插入考生用户
-- 密码: Candidate123!@# (BCrypt加密)
INSERT INTO public.users (id, username, password_hash, email, phone_number, full_name, roles, status, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000008'::uuid,
    'bdd_candidate',
    '$2a$10$.SP6ZyWCd9pF/v3c8HuAaei.I35zKkHaYaHVut6EFiPObspUH.f8G', -- Candidate123!@#
    'candidate@test-company.com',
    '13800138005',
    '测试考生',
    '["CANDIDATE"]',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 插入用户-租户-角色关联（考生）
INSERT INTO public.user_tenant_roles (id, user_id, tenant_id, role, granted_at)
VALUES (
    '00000000-0000-0000-0000-000000000009'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'CANDIDATE',
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 租户Schema中的测试数据
-- ============================================

-- 切换到租户Schema
SET search_path TO tenant_test_company_a;

-- 插入测试考试
INSERT INTO exams (id, code, title, description, status, registration_start, registration_end, fee_required, fee_amount, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000010'::uuid,
    'EXAM-2025-SPRING',
    '2025年春季招聘考试',
    'BDD测试用考试',
    'REGISTRATION_OPEN',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP + INTERVAL '30 days',
    TRUE,
    100.00,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- 插入测试岗位
INSERT INTO positions (id, exam_id, code, title, description, requirements, quota, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    'JAVA-001',
    'Java开发工程师',
    'Java后端开发岗位',
    '本科及以上学历，计算机相关专业',
    10,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    updated_at = CURRENT_TIMESTAMP;

-- 分配审核员到考试
INSERT INTO exam_reviewers (exam_id, reviewer_id, stage, created_at)
VALUES
    ('00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 'PRIMARY', CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000004'::uuid, 'SECONDARY', CURRENT_TIMESTAMP)
ON CONFLICT (exam_id, reviewer_id, stage) DO NOTHING;

-- 分配考试管理员
INSERT INTO exam_admins (id, exam_id, admin_id, permissions, created_by, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000012'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '["EXAM_UPDATE", "POSITION_CREATE", "REVIEW_STATISTICS"]'::jsonb,
    '00000000-0000-0000-0000-000000000002'::uuid,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (exam_id, admin_id) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- 插入测试报名申请（多种状态）
-- ============================================

-- 报名申请1: SUBMITTED状态 - 刚提交，等待自动审核
-- 修改ID为00000000-0000-0000-0000-000000000001，与BDD测试期望的ID匹配
INSERT INTO applications (id, exam_id, position_id, candidate_id, form_version, payload, status, payment_status, submitted_at, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid,
    1,
    '{"name": "测试考生", "gender": "男", "education": "本科", "major": "计算机科学与技术", "graduationSchool": "清华大学", "graduationTime": "2023-06"}'::jsonb,
    'SUBMITTED',
    'UNPAID',
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    updated_at = CURRENT_TIMESTAMP;

-- 报名申请2: PENDING_PRIMARY_REVIEW状态 - 等待一级审核
INSERT INTO applications (id, exam_id, position_id, candidate_id, form_version, payload, status, payment_status, submitted_at, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000021'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid,
    1,
    '{"name": "测试考生2", "gender": "女", "education": "硕士", "major": "软件工程", "graduationSchool": "北京大学", "graduationTime": "2024-06"}'::jsonb,
    'PENDING_PRIMARY_REVIEW',
    'UNPAID',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- 报名申请3: PRIMARY_PASSED状态 - 一级审核通过，等待二级审核
INSERT INTO applications (id, exam_id, position_id, candidate_id, form_version, payload, status, payment_status, submitted_at, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000022'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid,
    1,
    '{"name": "测试考生3", "gender": "男", "education": "本科", "major": "信息安全", "graduationSchool": "复旦大学", "graduationTime": "2023-06"}'::jsonb,
    'PRIMARY_PASSED',
    'UNPAID',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- 报名申请4: PENDING_SECONDARY_REVIEW状态 - 等待二级审核
INSERT INTO applications (id, exam_id, position_id, candidate_id, form_version, payload, status, payment_status, submitted_at, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000023'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid,
    1,
    '{"name": "测试考生4", "gender": "女", "education": "本科", "major": "网络工程", "graduationSchool": "上海交通大学", "graduationTime": "2023-06"}'::jsonb,
    'PENDING_SECONDARY_REVIEW',
    'UNPAID',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
)
ON CONFLICT (id) DO NOTHING;

-- 报名申请5: APPROVED状态 - 审核通过，等待支付
INSERT INTO applications (id, exam_id, position_id, candidate_id, form_version, payload, status, payment_status, submitted_at, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000024'::uuid,
    '00000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000008'::uuid,
    1,
    '{"name": "测试考生5", "gender": "男", "education": "本科", "major": "数据科学", "graduationSchool": "浙江大学", "graduationTime": "2023-06"}'::jsonb,
    'APPROVED',
    'UNPAID',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 插入审核任务
-- ============================================

-- 审核任务1: 报名申请1的一级审核任务（PENDING状态）
-- 更新application_id为00000000-0000-0000-0000-000000000001
INSERT INTO review_tasks (id, application_id, stage, assigned_to, status, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000030'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'PRIMARY',
    '00000000-0000-0000-0000-000000000003'::uuid,
    'OPEN',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

-- 审核任务2: 报名申请2的一级审核任务（ASSIGNED状态）
INSERT INTO review_tasks (id, application_id, stage, assigned_to, status, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000031'::uuid,
    '00000000-0000-0000-0000-000000000021'::uuid,
    'PRIMARY',
    '00000000-0000-0000-0000-000000000003'::uuid,
    'OPEN',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- 审核任务3: 报名申请4的二级审核任务（ASSIGNED状态）
INSERT INTO review_tasks (id, application_id, stage, assigned_to, status, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000032'::uuid,
    '00000000-0000-0000-0000-000000000023'::uuid,
    'SECONDARY',
    '00000000-0000-0000-0000-000000000004'::uuid,
    'OPEN',
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 插入审核记录
-- ============================================

-- 审核记录1: 报名申请3的一级审核通过记录
INSERT INTO reviews (id, application_id, stage, reviewer_id, decision, comment, reviewed_at, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000040'::uuid,
    '00000000-0000-0000-0000-000000000022'::uuid,
    'PRIMARY',
    '00000000-0000-0000-0000-000000000003'::uuid,
    'APPROVED',
    '材料齐全，符合要求',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- 审核记录2: 报名申请5的一级审核通过记录
INSERT INTO reviews (id, application_id, stage, reviewer_id, decision, comment, reviewed_at, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000041'::uuid,
    '00000000-0000-0000-0000-000000000024'::uuid,
    'PRIMARY',
    '00000000-0000-0000-0000-000000000003'::uuid,
    'APPROVED',
    '材料齐全，符合要求',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;

-- 审核记录3: 报名申请5的二级审核通过记录
INSERT INTO reviews (id, application_id, stage, reviewer_id, decision, comment, reviewed_at, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000042'::uuid,
    '00000000-0000-0000-0000-000000000024'::uuid,
    'SECONDARY',
    '00000000-0000-0000-0000-000000000004'::uuid,
    'APPROVED',
    '最终审核通过',
    CURRENT_TIMESTAMP - INTERVAL '6 hours',
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
)
ON CONFLICT (id) DO NOTHING;

-- 恢复默认search_path
RESET search_path;

