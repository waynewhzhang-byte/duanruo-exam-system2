# SSO 用户模型重构说明

## 重构目标

将用户模型从"单租户绑定"重构为"全局 SSO + 多租户角色"模式，支持一个用户在多个租户中拥有不同角色。

## 重构前的问题

### 原有设计

- `User` 聚合包含 `TenantId tenantId` 字段
- 一个用户只能属于一个租户
- 租户管理员/审核员通过 `User.tenantId` 与租户关联
- 无法支持"一个考生报名多个租户的考试"场景

### 局限性

1. **跨租户报名困难**：考生无法用同一账号报名不同租户的考试
2. **角色管理不灵活**：用户无法在不同租户担任不同角色
3. **与 SAAS-PRD 不一致**：PRD 要求全局 SSO + 多租户角色

## 重构后的设计

### 核心模型

#### 1. User（全局实体）

- 存储在 `public.users` 表
- 只包含全局身份信息和全局角色（如 `SUPER_ADMIN`）
- **不再绑定 `tenantId`**（已标记为 `@Deprecated`）

#### 2. UserTenantRole（用户-租户-角色关联）

- 存储在 `public.user_tenant_roles` 表
- 表示"用户 U 在租户 T 中拥有角色 R"
- 一个用户可以在多个租户拥有不同角色

#### 3. 租户内业务表

- `tenant_xxx.candidates`：考生在该租户的报名记录
- `tenant_xxx.reviewers`：审核员在该租户的分配记录

### 数据模型

```
public.users (全局用户)
├── id: UUID
├── username: VARCHAR
├── email: VARCHAR (加密)
├── roles: TEXT (JSON，全局角色如 SUPER_ADMIN)
└── ...

public.user_tenant_roles (用户-租户-角色)
├── id: UUID
├── user_id: UUID → public.users.id
├── tenant_id: UUID → public.tenants.id
├── role: VARCHAR (TENANT_ADMIN, PRIMARY_REVIEWER, SECONDARY_REVIEWER, CANDIDATE)
├── granted_at: TIMESTAMP
├── active: BOOLEAN
└── ...

tenant_xxx.candidates (租户内考生)
├── id: UUID
├── user_id: UUID → public.users.id
├── exam_id: UUID
└── ...
```

## 重构实施

### 阶段 1：标记废弃 + 双线逻辑（当前阶段）

#### 已完成的修改

1. **User 聚合**（`exam-domain/src/main/java/com/duanruo/exam/domain/user/User.java`）
   - `tenantId` 字段标记为 `@Deprecated`
   - `getTenantId()` 标记为 `@Deprecated`
   - `setTenantId()` 标记为 `@Deprecated`
   - `belongsToTenant()` 标记为 `@Deprecated`
   - `isTenantAdmin()` 标记为 `@Deprecated`
   - `isSystemAdmin()` 修改为只检查 `SUPER_ADMIN` 角色，不再依赖 `tenantId`

2. **应用层已正确使用 UserTenantRole**
   - `AuthenticationService`：使用 `UserTenantRoleRepository.belongsToTenant()`
   - `ExamPermissionService`：使用 `UserTenantRoleRepository.hasRole()`
   - `UserManagementApplicationService`：创建用户时自动创建 `UserTenantRole`
   - `ApplicationApplicationService`：考生报名时自动创建 `CANDIDATE` 角色

#### 数据库已就绪

- `public.user_tenant_roles` 表已通过 Flyway V010 创建
- `UserTenantRoleEntity` 和 `JpaUserTenantRoleRepository` 已实现
- `UserTenantRoleRepository` 接口已定义并实现

### 阶段 2：完全移除 tenantId（未来）

当确认所有代码不再使用废弃方法后：

1. 从 `User` 聚合删除 `tenantId` 字段及相关方法
2. 从 `UserEntity` 确认没有 `tenant_id` 列（已确认）
3. 更新所有文档和 OpenAPI 规范

## 授权模式

### 认证（Authentication）

JWT Payload 只包含：
- `userId`（全局）
- 全局角色（如 `SUPER_ADMIN`）
- **不包含 `tenantId`**

### 租户上下文（Tenant Context）

每个请求通过以下方式确定当前租户：
- `X-Tenant-ID` 请求头
- URL 路径 `/tenants/{tenantId}/...`
- 租户子域名（未来）

### 授权（Authorization）

所有租户级权限检查遵循以下模式：

```java
UserId userId = authContext.getCurrentUserId();  // 从 JWT
TenantId tenantId = tenantContext.getCurrentTenantId();  // 从请求

// 检查用户在当前租户是否有特定角色
boolean hasPermission = userTenantRoleRepository.hasRole(userId, tenantId, Role.TENANT_ADMIN);
```

## 使用示例

### 创建租户管理员

```java
// 1. 创建全局用户（只有全局角色）
User user = new User(userId, username, email, passwordHash, fullName, Set.of(Role.CANDIDATE));
userRepository.save(user);

// 2. 授予租户管理员角色
UserTenantRole utr = UserTenantRole.create(userId, tenantId, Role.TENANT_ADMIN, grantedBy);
userTenantRoleRepository.save(utr);
```

### 考生跨租户报名

```java
// 考生用同一账号报名租户 A 的考试
ensureCandidateTenantRole(userId, tenantIdA);  // 自动创建 UserTenantRole

// 考生用同一账号报名租户 B 的考试
ensureCandidateTenantRole(userId, tenantIdB);  // 自动创建另一个 UserTenantRole
```

## 迁移指南

### 对于新代码

- **禁止使用** `User.getTenantId()`, `User.setTenantId()`, `User.belongsToTenant()`, `User.isTenantAdmin()`
- **使用** `UserTenantRoleRepository` 进行所有租户级权限检查

### 对于现有代码

- 废弃方法仍然可用，但会在编译时产生警告
- 建议尽快迁移到新模式

## 参考资料

- SAAS-PRD.md：多租户 SSO 需求
- UserTenantRole.java：用户-租户-角色聚合
- UserTenantRoleRepository.java：仓储接口
- V010__Create_tenant_tables.sql：数据库 migration

