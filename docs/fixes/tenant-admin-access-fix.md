# 租户管理员访问权限修复

## 问题描述

用户报告：使用租户管理员登录后，访问 `/[tenantSlug]/admin/exams/[examId]/detail` 页面点击"开启报名"按钮时，收到错误：

```
Access denied: User does not belong to this tenant
```

## 问题根源

系统采用 **SSO User Model（全局用户 + 多租户角色）** 架构：
- 用户是全局实体，存储在 `public.users` 表
- 用户与租户的关联通过 `public.user_tenant_roles` 表管理

### 问题所在

当通过 `/auth/admin/create-tenant-admin` API 创建租户管理员时：

**旧实现**：
1. ✅ 创建用户记录并保存到 `public.users` 表
2. ✅ 将 `TENANT_ADMIN` 角色添加到用户的全局角色中
3. ❌ **没有**在 `public.user_tenant_roles` 表中创建关联记录

因此，虽然用户可以登录（用户账号存在），但无法访问任何租户的资源（`user_tenant_roles` 表中没有关联记录）。

### 权限验证逻辑

**TenantInterceptor.java:111-127**：
```java
boolean belongsToTenant = userTenantRoleRepository.belongsToTenant(userId, tenantId);
if (!belongsToTenant) {
    // 返回 "Access denied: User does not belong to this tenant"
}
```

该检查查询 `user_tenant_roles` 表：
```sql
SELECT CASE WHEN COUNT(utr) > 0 THEN true ELSE false END
FROM UserTenantRoleEntity utr
WHERE utr.userId = :userId
  AND utr.tenantId = :tenantId
  AND utr.active = true
```

## 修复方案

### 修改内容

#### 1. RegisterRequest DTO
**文件**: `exam-application/src/main/java/com/duanruo/exam/application/dto/RegisterRequest.java`

**修改**：添加 `tenantId` 字段
```java
/**
 * 租户ID（可选）
 * 用于创建租户管理员时指定所属租户
 */
private String tenantId;
```

#### 2. AuthenticationService
**文件**: `exam-application/src/main/java/com/duanruo/exam/application/service/AuthenticationService.java`

**修改**：`createSystemUser()` 方法新增逻辑
```java
// 如果提供了 tenantId，创建 UserTenantRole 关联
if (request.getTenantId() != null && !request.getTenantId().isBlank()) {
    TenantId tenantId = TenantId.of(UUID.fromString(request.getTenantId()));

    for (Role role : roles) {
        // 只为租户角色创建关联，跳过全局角色
        if (role != Role.SUPER_ADMIN && role != Role.ADMIN) {
            UserTenantRole userTenantRole = UserTenantRole.create(
                userId, tenantId, role, userId.getValue()
            );
            userTenantRoleRepository.save(userTenantRole);
        }
    }
}
```

**关键改进**：
- 全局角色（`SUPER_ADMIN`, `ADMIN`）存储在 `users.roles` 字段
- 租户角色（`TENANT_ADMIN`, `PRIMARY_REVIEWER` 等）存储在 `user_tenant_roles` 表
- 创建租户管理员时自动创建 `UserTenantRole` 记录

#### 3. AuthController
**文件**: `exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/controller/AuthController.java`

**修改**：`createTenantAdmin()` 方法添加验证
```java
// 验证 tenantId 必须提供
if (request.getTenantId() == null || request.getTenantId().isBlank()) {
    throw new ApplicationException("创建租户管理员时必须提供 tenantId");
}
```

#### 4. 前端代码
**文件**: `web/src/app/admin/users/page.tsx`

**修改**：在创建租户管理员时传递 `tenantId`
```typescript
// 创建用户，如果是租户管理员，在请求中包含 tenantId
const requestBody = selectedRole === 'TENANT_ADMIN' && selectedTenantId
  ? { ...form, tenantId: selectedTenantId }
  : form

const userResponse = await apiPost<{ id: string }>(roleConfig.endpoint, requestBody)
```

**移除**：原有的二次调用逻辑（已不需要）

### 编译结果

✅ 后端编译成功（无错误）
```
[INFO] BUILD SUCCESS
[INFO] Total time:  20.425 s
```

## 修复现有数据

### 方案1：使用 SQL 脚本（推荐）

#### 步骤1：检查数据
运行检查脚本：
```bash
psql -U postgres -d duanruo-exam-system -f scripts/check-missing-user-tenant-roles.sql
```

脚本会显示：
- 所有租户列表
- 所有用户列表
- 缺少 `UserTenantRole` 记录的租户管理员

#### 步骤2：修复数据
1. 编辑 `scripts/fix-missing-user-tenant-roles.sql`
2. 填入正确的 `user_id` 和 `tenant_id`
3. 执行修复脚本：
```bash
psql -U postgres -d duanruo-exam-system -f scripts/fix-missing-user-tenant-roles.sql
```

**示例**：
```sql
INSERT INTO public.user_tenant_roles (
    id, user_id, tenant_id, role, active, granted_by, created_at, updated_at
)
VALUES (
    gen_random_uuid(),
    'a1b2c3d4-...'::uuid,  -- 用户 UUID
    'e5f6g7h8-...'::uuid,  -- 租户 UUID
    'TENANT_ADMIN',
    true,
    'a1b2c3d4-...'::uuid,  -- 授予者（暂时使用自己的 ID）
    NOW(),
    NOW()
);
```

### 方案2：使用 PowerShell 脚本

运行交互式修复脚本：
```powershell
.\scripts\fix-tenant-admin-access.ps1
```

按提示输入：
1. 租户管理员的用户名
2. 租户的 slug（如 `test_company_1762456657147`）
3. 超级管理员的 JWT Token
4. 用户的 UUID

脚本会自动调用 API 创建关联。

### 方案3：使用 API（手动）

```bash
# 1. 获取租户信息
curl "http://localhost:8081/api/v1/tenants/slug/test_company_1762456657147" \
  -H "Authorization: Bearer {SUPER_ADMIN_TOKEN}"

# 2. 添加用户到租户
curl -X POST "http://localhost:8081/api/v1/{TENANT_UUID}/users/{USER_UUID}/roles?role=TENANT_ADMIN" \
  -H "Authorization: Bearer {SUPER_ADMIN_TOKEN}" \
  -H "Content-Type: application/json"
```

## 测试验证

### 1. 重启后端
```bash
.\scripts\start-backend.ps1
```

### 2. 创建新的租户管理员
使用前端或 API 创建租户管理员，确保在请求中包含 `tenantId`：

```json
{
  "username": "tenant_admin_test",
  "email": "admin@test.com",
  "password": "password123",
  "confirmPassword": "password123",
  "fullName": "Test Admin",
  "tenantId": "租户的UUID"
}
```

### 3. 登录测试
1. 使用租户管理员账号登录
2. 访问租户资源（如考试管理页面）
3. 验证不再出现 "Access denied" 错误

### 4. 验证数据库
```sql
-- 检查 user_tenant_roles 表
SELECT
    u.username,
    t.code AS tenant_code,
    utr.role,
    utr.active
FROM public.user_tenant_roles utr
JOIN public.users u ON utr.user_id = u.id
JOIN public.tenants t ON utr.tenant_id = t.id
WHERE utr.role = 'TENANT_ADMIN';
```

应该能看到新创建的租户管理员有对应的记录。

## API 文档更新

### POST /api/v1/auth/admin/create-tenant-admin

**请求体**：
```json
{
  "username": "string (必填)",
  "email": "string (必填)",
  "password": "string (必填)",
  "confirmPassword": "string (必填)",
  "fullName": "string (必填)",
  "phoneNumber": "string (可选)",
  "department": "string (可选)",
  "jobTitle": "string (可选)",
  "tenantId": "string (必填) - 租户的UUID"
}
```

**注意**：
- ⚠️ `tenantId` 字段现在是**必填**的
- 系统会自动在 `user_tenant_roles` 表中创建用户-租户关联
- 不再需要额外调用 API 来关联用户和租户

## 影响范围

### 不受影响
- ✅ 超级管理员（`SUPER_ADMIN`）- 仍然可以访问所有租户
- ✅ 现有的 `UserTenantRole` 记录 - 不会被修改
- ✅ 候选人注册 - 不受影响

### 需要修复
- ⚠️ 现有的租户管理员（在修复前创建的）- 需要运行修复脚本
- ⚠️ 前端调用 - 需要更新到最新代码

## 后续建议

1. **数据迁移**：为所有现有的租户管理员创建 `UserTenantRole` 记录
2. **文档更新**：更新 API 文档，说明 `tenantId` 是必填字段
3. **单元测试**：添加测试用例验证 `UserTenantRole` 的创建
4. **前端验证**：确保前端在创建租户管理员时必须选择租户

## 相关文件

**后端**：
- `exam-application/src/main/java/com/duanruo/exam/application/dto/RegisterRequest.java`
- `exam-application/src/main/java/com/duanruo/exam/application/service/AuthenticationService.java`
- `exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/controller/AuthController.java`

**前端**：
- `web/src/app/admin/users/page.tsx`

**脚本**：
- `scripts/check-missing-user-tenant-roles.sql` - 检查脚本
- `scripts/fix-missing-user-tenant-roles.sql` - SQL 修复脚本
- `scripts/fix-tenant-admin-access.ps1` - PowerShell 修复脚本

**文档**：
- `docs/fixes/tenant-admin-access-fix.md` - 本文档

## 修复日期

2025-11-23
