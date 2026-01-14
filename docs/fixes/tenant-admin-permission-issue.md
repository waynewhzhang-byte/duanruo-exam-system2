# 租户管理员权限问题分析和解决方案

## 问题描述

租户管理员 `duanruotest1` 登录系统后，访问考试列表时提示"没有权限"（403 Forbidden）。

## 问题分析

### 1. API 权限要求

考试列表接口的权限检查：

```java
@GetMapping
@PreAuthorize("hasAnyAuthority('EXAM_VIEW', 'EXAM_VIEW_PUBLIC')")
public ResponseEntity<List<ExamResponse>> getAllExams()
```

要求用户必须有 `EXAM_VIEW` 或 `EXAM_VIEW_PUBLIC` **权限**（Permission）。

### 2. 租户管理员角色定义

`TENANT_ADMIN` 角色**确实包含** `EXAM_VIEW` 权限：

```java
public static final Role TENANT_ADMIN = new Role(
    "TENANT_ADMIN",
    "租户管理员 - 管理特定租户内的所有事务",
    Set.of(
        Permission.EXAM_CREATE,
        Permission.EXAM_EDIT,
        Permission.EXAM_DELETE,
        Permission.EXAM_VIEW,  // ✅ 包含此权限
        ...
    )
);
```

### 3. 登录和 Token 生成逻辑

登录时会：
1. 查询用户的全局角色（存储在 `users.roles`）
2. 查询用户的租户角色（存储在 `user_tenant_roles`）
3. 合并全局角色和租户角色
4. 生成包含所有角色和权限的 JWT Token

```java
// 合并全局角色和租户角色
Set<Role> allRoles = new HashSet<>(user.getRoles());
allRoles.add(primaryTenantRole.getRole());

// 生成 Token
token = jwtTokenService.generateTenantToken(..., allRoles, ...);
```

### 4. 根本原因

经过全局角色分配修复后，租户管理员的全局角色为**空**（`[]`），租户角色存储在 `user_tenant_roles` 表中。

**可能的问题**：

1. **`user_tenant_roles` 表中没有该用户的记录**
   - 用户是在修复之前创建的
   - 创建时没有正确插入 `user_tenant_roles` 记录

2. **`user_tenant_roles` 记录存在但 `is_active = false`**
   - 角色被撤销或停用

3. **租户ID不匹配**
   - Token 中的租户ID与实际租户不一致

## 解决方案

### 方案1：检查数据库记录

```sql
-- 查看用户的全局角色和租户角色
SELECT 
    u.id as user_id,
    u.username,
    u.roles as global_roles,
    utr.id as user_tenant_role_id,
    utr.tenant_id,
    utr.role as tenant_role,
    utr.is_active,
    t.name as tenant_name,
    t.code as tenant_code
FROM users u
LEFT JOIN user_tenant_roles utr ON u.id = utr.user_id
LEFT JOIN tenants t ON utr.tenant_id = t.id
WHERE u.username = 'duanruotest1';
```

**预期结果**：
- `global_roles`: `[]` 或 `null`（正常）
- `tenant_role`: `TENANT_ADMIN`
- `is_active`: `true`
- `tenant_id`: 应该有值

### 方案2：修复缺失的租户角色记录

如果 `user_tenant_roles` 表中没有记录，手动创建：

```sql
-- 为租户管理员创建租户角色记录
INSERT INTO user_tenant_roles (
    id,
    user_id,
    tenant_id,
    role,
    granted_at,
    granted_by,
    is_active
)
SELECT 
    gen_random_uuid(),
    u.id,
    t.id,
    'TENANT_ADMIN',
    NOW(),
    u.id,
    true
FROM users u
CROSS JOIN tenants t
WHERE u.username = 'duanruotest1'
  AND t.code = 'duanruo'  -- 替换为实际的租户code
  AND NOT EXISTS (
      SELECT 1 FROM user_tenant_roles utr
      WHERE utr.user_id = u.id
        AND utr.tenant_id = t.id
        AND utr.role = 'TENANT_ADMIN'
  );
```

### 方案3：激活已停用的角色

如果记录存在但 `is_active = false`：

```sql
UPDATE user_tenant_roles
SET is_active = true,
    granted_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE username = 'duanruotest1')
  AND role = 'TENANT_ADMIN'
  AND is_active = false;
```

### 方案4：重新创建用户（推荐）

使用修复后的代码重新创建租户管理员：

```bash
# 1. 删除旧用户（如果需要）
DELETE FROM user_tenant_roles WHERE user_id = (SELECT id FROM users WHERE username = 'duanruotest1');
DELETE FROM users WHERE username = 'duanruotest1';

# 2. 通过 API 重新创建
POST /api/v1/users
{
  "username": "duanruotest1",
  "password": "Waynez0625@wh",
  "email": "duanruotest1@example.com",
  "fullName": "端若测试1",
  "globalRoles": [],  // 或不传
  "tenantId": "<tenant-uuid>",
  "tenantRole": "TENANT_ADMIN"
}
```

## 验证步骤

### 1. 检查 Token 内容

登录后，解码 JWT Token 的 payload 部分，检查：

```json
{
  "userId": "...",
  "username": "duanruotest1",
  "tenantId": "...",
  "tokenType": "TENANT",
  "roles": ["TENANT_ADMIN"],  // ✅ 应该包含
  "permissions": [
    "exam:create",
    "exam:edit",
    "exam:delete",
    "exam:view",  // ✅ 应该包含
    ...
  ]
}
```

### 2. 测试 API 访问

```bash
# 获取 Token
TOKEN=$(curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"duanruotest1","password":"Waynez0625@wh"}' \
  | jq -r '.token')

# 测试获取考试列表
curl -X GET http://localhost:8081/api/v1/exams \
  -H "Authorization: Bearer $TOKEN"
```

## 设计改进建议

### 1. 添加数据一致性检查

在用户登录时，检查租户角色记录是否存在：

```java
if (userTenantRoles.isEmpty() && !user.hasRole(Role.SUPER_ADMIN)) {
    log.warn("User {} has no tenant roles and is not SUPER_ADMIN", user.getUsername());
    throw new ApplicationException("用户未分配任何租户角色，请联系管理员");
}
```

### 2. 提供更友好的错误信息

当权限不足时，返回更详细的错误信息：

```java
@ExceptionHandler(AccessDeniedException.class)
public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
    return ResponseEntity.status(403).body(new ErrorResponse(
        "权限不足",
        "您没有访问此资源的权限。请检查您的角色和权限配置。"
    ));
}
```

### 3. 添加管理界面

提供管理界面查看和管理用户的租户角色，避免手动修改数据库。

## 总结

租户管理员权限问题的根本原因是 `user_tenant_roles` 表中缺少或未激活租户角色记录。修复方法是：

1. 检查数据库记录
2. 补充缺失的租户角色记录
3. 或重新创建用户

修复后，租户管理员应该能够正常访问考试列表和其他需要 `EXAM_VIEW` 权限的接口。

