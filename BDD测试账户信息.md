# BDD测试账户信息

## 📋 概述

本文档包含所有BDD测试使用的账户信息，包括超级管理员、租户管理员、审核员和考生账户。

**重要提示**: 这些账户仅用于开发和测试环境，请勿在生产环境使用！

---

## 🔐 测试账户列表

### 1. 超级管理员 (Super Admin)

**用途**: 系统级管理，创建和管理租户

| 字段 | 值 |
|------|-----|
| **用户名** | `super_admin` |
| **密码** | `SuperAdmin123!@#` |
| **邮箱** | super_admin@system.com |
| **手机** | 13800138000 |
| **姓名** | 超级管理员 |
| **角色** | SUPER_ADMIN |
| **用户ID** | 00000000-0000-0000-0000-000000000000 |
| **状态** | ACTIVE |

**权限**:
- ✅ 查看所有租户
- ✅ 创建租户
- ✅ 更新租户
- ✅ 删除租户
- ✅ 激活/停用租户
- ✅ 用户管理
- ✅ 系统配置

**登录URL**: `http://localhost:3000/login?role=super-admin`

---

### 2. 租户管理员 (Tenant Admin)

#### 2.1 主测试租户管理员

**用途**: 租户级管理，创建和管理考试

| 字段 | 值 |
|------|-----|
| **用户名** | `tenant_admin_1762476737466` |
| **密码** | `TenantAdmin@123` |
| **邮箱** | tenant_admin@test-company.com |
| **手机** | 13800138002 |
| **姓名** | 租户管理员 |
| **角色** | TENANT_ADMIN |
| **租户ID** | 421eee4a-1a2a-4f9d-95a4-37073d4b15c5 |
| **租户代码** | test_company_1762456657147 |
| **租户名称** | 测试公司-1762456657147 |
| **状态** | ACTIVE |

**权限**:
- ✅ 创建和管理考试
- ✅ 创建和管理岗位
- ✅ 创建和管理科目
- ✅ 配置报名表单
- ✅ 管理审核员
- ✅ 查看报名数据
- ✅ 录入成绩
- ✅ 安排考场座位

**登录URL**: `http://localhost:3000/login`

#### 2.2 BDD测试租户管理员（通用）

| 字段 | 值 |
|------|-----|
| **用户名** | `tenant_admin` |
| **密码** | `TenantAdmin123!@#` |
| **邮箱** | tenant_admin@test-company.com |
| **租户名称** | 测试企业A |
| **租户Slug** | test-company-a |

---

### 3. 审核员 (Reviewers)

#### 3.1 一级审核员

**用途**: 一级审核考生报名材料

| 字段 | 值 |
|------|-----|
| **用户名** | `bdd_reviewer1` |
| **密码** | `Reviewer123!@#` |
| **邮箱** | reviewer1@test-company.com |
| **手机** | 13800138003 |
| **姓名** | 一级审核员 |
| **角色** | PRIMARY_REVIEWER |
| **状态** | ACTIVE |

**权限**:
- ✅ 查看待审核报名
- ✅ 审核报名材料（一级）
- ✅ 通过/拒绝报名
- ✅ 添加审核意见

**登录URL**: `http://localhost:3000/login?role=reviewer`

#### 3.2 二级审核员

**用途**: 二级审核考生报名材料（最终审核）

| 字段 | 值 |
|------|-----|
| **用户名** | `bdd_reviewer2` |
| **密码** | `Reviewer123!@#` |
| **邮箱** | reviewer2@test-company.com |
| **手机** | 13800138004 |
| **姓名** | 二级审核员 |
| **角色** | SECONDARY_REVIEWER |
| **状态** | ACTIVE |

**权限**:
- ✅ 查看一级审核通过的报名
- ✅ 审核报名材料（二级）
- ✅ 最终通过/拒绝报名
- ✅ 添加审核意见

**登录URL**: `http://localhost:3000/login?role=reviewer`

---

### 4. 考生 (Candidates)

#### 4.1 主测试考生

**用途**: 考生报名、查看准考证、查询成绩

| 字段 | 值 |
|------|-----|
| **用户名** | `candidate_1762476516042` |
| **密码** | `Candidate@123` |
| **邮箱** | candidate@test-company.com |
| **手机** | 13800138005 |
| **姓名** | 张三 |
| **身份证** | 110101199001011234 |
| **性别** | 男 |
| **出生日期** | 1990-01-01 |
| **学历** | 本科 |
| **专业** | 计算机科学与技术 |
| **毕业学校** | 清华大学 |
| **毕业日期** | 2020-06 |
| **角色** | CANDIDATE |
| **状态** | ACTIVE |

**权限**:
- ✅ 报名考试
- ✅ 上传附件材料
- ✅ 查看报名状态
- ✅ 在线支付
- ✅ 下载准考证
- ✅ 查询成绩

**登录URL**: `http://localhost:3000/login`

#### 4.2 BDD测试考生（通用）

| 字段 | 值 |
|------|-----|
| **用户名** | `bdd_candidate` |
| **密码** | `Candidate123!@#` |
| **邮箱** | bdd_candidate@test.com |
| **姓名** | 张三 |
| **身份证** | 110101199001011234 |

---

## 🔧 账户创建方式

### 数据库迁移脚本

所有测试账户通过Flyway迁移脚本自动创建：

**文件位置**: `exam-infrastructure/src/main/resources/db/migration/V999__Insert_BDD_test_data.sql`

### 手动创建（如需要）

如果需要手动创建测试账户，可以使用以下SQL：

```sql
-- 超级管理员
INSERT INTO public.users (id, username, password_hash, email, phone_number, full_name, roles, status)
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'super_admin',
    '$2a$10$IJn3H1W5rHcOBA677AcVI.lPWCV7TBY09PBKvn6Zah6qlBZOSMeUO', -- SuperAdmin123!@#
    'super_admin@system.com',
    '13800138000',
    '超级管理员',
    '["SUPER_ADMIN"]',
    'ACTIVE'
);
```

---

## 📝 使用说明

### Chrome DevTools 真实登录操作

#### 1. 超级管理员登录

```typescript
// 导航到登录页面
await page.goto('http://localhost:3000/login?role=super-admin');

// 填写登录表单
await page.fill('input[name="username"]', 'super_admin');
await page.fill('input[name="password"]', 'SuperAdmin123!@#');

// 点击登录按钮
await page.click('button[type="submit"]');

// 等待跳转
await page.waitForURL(/\/super-admin/);
```

#### 2. 租户管理员登录

```typescript
// 导航到登录页面
await page.goto('http://localhost:3000/login');

// 填写登录表单
await page.fill('input[name="username"]', 'tenant_admin_1762476737466');
await page.fill('input[name="password"]', 'TenantAdmin@123');

// 点击登录按钮
await page.click('button[type="submit"]');

// 等待跳转到管理页面
await page.waitForURL(/\/admin|\/tenant/);
```

#### 3. 考生登录

```typescript
// 导航到登录页面
await page.goto('http://localhost:3000/login');

// 填写登录表单
await page.fill('input[name="username"]', 'candidate_1762476516042');
await page.fill('input[name="password"]', 'Candidate@123');

// 点击登录按钮
await page.click('button[type="submit"]');

// 等待跳转到考生页面
await page.waitForURL(/\/my-/);
```

---

## 🔍 验证账户

### 通过数据库验证

```sql
-- 查看所有测试账户
SELECT id, username, email, full_name, roles, status 
FROM public.users 
WHERE username IN (
    'super_admin', 
    'tenant_admin_1762476737466', 
    'tenant_admin',
    'bdd_reviewer1', 
    'bdd_reviewer2', 
    'candidate_1762476516042',
    'bdd_candidate'
);
```

### 通过API验证

```powershell
# 测试超级管理员登录
$loginData = @{
    username = "super_admin"
    password = "SuperAdmin123!@#"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/login" `
    -Method POST `
    -Body $loginData `
    -ContentType "application/json"
```

---

## 📚 相关文档

1. **web/tests/bdd/fixtures/bdd-test-data.ts** - BDD测试数据配置
2. **exam-infrastructure/src/main/resources/db/migration/V999__Insert_BDD_test_data.sql** - 数据库迁移脚本
3. **web/tests/bdd/step-definitions/auth.steps.ts** - 登录步骤定义
4. **UI测试执行指南.md** - UI测试执行说明

---

**最后更新**: 2025-11-07  
**维护人**: Augment Agent

