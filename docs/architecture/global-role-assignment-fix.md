# 全局角色分配修复说明

## 问题描述

之前的实现中，创建租户管理员（TENANT_ADMIN）或审核员时，会自动赋予 `CANDIDATE` 全局角色，导致管理员同时拥有管理权限和考生身份，这不符合设计原则。

## 设计原则

### 全局角色（存储在 `users.roles`）

只有两种全局角色：

1. **SUPER_ADMIN** - 平台级管理员
   - 拥有所有权限
   - 可以管理所有租户
   - 可以创建租户和用户

2. **CANDIDATE** - 全局考生身份
   - 可以跨租户报名考试
   - 只有需要报名考试的用户才应该拥有此角色
   - **管理角色用户不应自动获得此角色**

### 租户角色（存储在 `user_tenant_roles`）

通过 `UserTenantRole` 表关联，包括：

- `TENANT_ADMIN` - 租户管理员
- `PRIMARY_REVIEWER` - 一级审核员
- `SECONDARY_REVIEWER` - 二级审核员
- `EXAM_ADMIN` - 考试管理员
- `EXAMINER` - 考官

## 修复内容

### 1. `UserManagementApplicationService.createUser()`

**修改前**：
```java
if (globalRoles == null || globalRoles.isEmpty()) {
    globalRoles = Set.of(Role.CANDIDATE); // ❌ 默认赋予CANDIDATE
}
```

**修改后**：
```java
if (globalRoles == null) {
    globalRoles = Set.of(); // ✅ 默认为空，不自动赋予任何全局角色
}
```

**影响**：超级管理员创建租户管理员时，不再自动赋予 `CANDIDATE` 全局角色。

### 2. `UserManagementApplicationService.createTenantUser()`

**修改前**：
```java
User user = new User(..., Set.of(Role.CANDIDATE)); // ❌ 强制赋予CANDIDATE
```

**修改后**：
```java
User user = new User(..., Set.of()); // ✅ 全局角色为空
```

**影响**：租户管理员创建审核员时，不再自动赋予 `CANDIDATE` 全局角色。

### 3. `AuthenticationService.createSystemUser()`

**修改前**：
```java
if (globalRoles.isEmpty()) {
    globalRoles = Set.of(Role.CANDIDATE); // ❌ 默认赋予CANDIDATE
}
```

**修改后**：
```java
// ✅ 不再默认赋予CANDIDATE，保持全局角色为空（除非显式指定）
```

### 4. `UserManagementApplicationService.validateTenantRole()`

**修改前**：
```java
Set<Role> allowedTenantRoles = Set.of(
    Role.TENANT_ADMIN, ..., Role.CANDIDATE); // ❌ 允许CANDIDATE作为租户角色
```

**修改后**：
```java
if (role == Role.CANDIDATE) {
    throw new ApplicationException("CANDIDATE是全局角色，不能作为租户角色分配");
}
Set<Role> allowedTenantRoles = Set.of(
    Role.TENANT_ADMIN, ...); // ✅ 移除CANDIDATE
```

### 5. `AuthenticationService.registerCandidate()` - 保持不变

```java
User user = new User(..., Set.of(Role.CANDIDATE)); // ✅ 考生注册时赋予CANDIDATE全局角色
```

**说明**：考生自己注册时，应该赋予 `CANDIDATE` 全局角色，这是正确的。

## 使用场景

### 场景1：创建纯管理员用户

```java
CreateUserRequest request = new CreateUserRequest();
request.setUsername("admin1");
request.setGlobalRoles(Set.of()); // 或 null
request.setTenantId("tenant-uuid");
request.setTenantRole(Role.TENANT_ADMIN);

// 结果：
// - 全局角色：空
// - 租户角色：TENANT_ADMIN（在指定租户下）
```

### 场景2：创建既是管理员又是考生的用户

```java
CreateUserRequest request = new CreateUserRequest();
request.setUsername("admin2");
request.setGlobalRoles(Set.of(Role.CANDIDATE)); // 显式指定CANDIDATE
request.setTenantId("tenant-uuid");
request.setTenantRole(Role.TENANT_ADMIN);

// 结果：
// - 全局角色：CANDIDATE
// - 租户角色：TENANT_ADMIN（在指定租户下）
```

### 场景3：考生自己注册

```java
RegisterRequest request = new RegisterRequest();
request.setUsername("candidate1");
authenticationService.registerCandidate(request);

// 结果：
// - 全局角色：CANDIDATE
// - 租户角色：无（首次报名时自动创建）
```

## 数据库影响

修复后，数据库中的数据结构：

```sql
-- 纯管理员用户
SELECT * FROM users WHERE username = 'admin1';
-- roles: []

-- 既是管理员又是考生的用户
SELECT * FROM users WHERE username = 'admin2';
-- roles: ["CANDIDATE"]

-- 考生用户
SELECT * FROM users WHERE username = 'candidate1';
-- roles: ["CANDIDATE"]

-- 租户角色关联
SELECT * FROM user_tenant_roles WHERE user_id = 'admin1-uuid';
-- role: TENANT_ADMIN, tenant_id: tenant-uuid
```

## 迁移建议

如果现有数据库中已有错误的全局角色分配，可以运行以下SQL清理：

```sql
-- 查看当前有全局CANDIDATE角色但同时有租户管理角色的用户
SELECT u.id, u.username, u.roles, array_agg(utr.role) as tenant_roles
FROM users u
JOIN user_tenant_roles utr ON u.id = utr.user_id
WHERE u.roles::text LIKE '%CANDIDATE%'
  AND utr.role IN ('TENANT_ADMIN', 'PRIMARY_REVIEWER', 'SECONDARY_REVIEWER', 'EXAM_ADMIN', 'EXAMINER')
GROUP BY u.id, u.username, u.roles;

-- 清除管理员用户的CANDIDATE全局角色（根据实际情况调整）
-- 注意：只清除那些不需要报名考试的管理员
UPDATE users
SET roles = '[]'::jsonb
WHERE id IN (
    SELECT DISTINCT u.id
    FROM users u
    JOIN user_tenant_roles utr ON u.id = utr.user_id
    WHERE u.roles::text LIKE '%CANDIDATE%'
      AND utr.role IN ('TENANT_ADMIN', 'PRIMARY_REVIEWER', 'SECONDARY_REVIEWER')
      AND u.roles::text NOT LIKE '%SUPER_ADMIN%'
);
```

## 总结

修复后的角色分配逻辑更加清晰：

- ✅ 管理角色用户默认**不**拥有 `CANDIDATE` 全局角色
- ✅ 只有考生注册或显式指定时才赋予 `CANDIDATE` 全局角色
- ✅ `CANDIDATE` 不能作为租户角色分配
- ✅ 如果管理员需要报名考试，需要显式授予 `CANDIDATE` 全局角色

