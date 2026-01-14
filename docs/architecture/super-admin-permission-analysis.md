# 超级管理员权限认证机制分析报告

## 📋 执行摘要

**问题**：超级管理员在创建租户时遇到403 Forbidden错误："Access denied: User does not belong to this tenant"

**根本原因**：TenantInterceptor的路径跳过规则不完整，未跳过`/super-admin/`路径，导致超级管理员API被租户归属检查阻拦。

**解决方案**：在TenantInterceptor中添加对`/super-admin/`路径的跳过验证。

**状态**：✅ 已修复，待重启后端验证

---

## 🔍 问题诊断过程

### 1. 错误表现

前端调用：`POST http://localhost:8081/api/v1/super-admin/tenants`

后端返回：
```json
{
  "error": "Forbidden",
  "message": "Access denied: User does not belong to this tenant",
  "status": 403,
  "timestamp": "2025-11-22T07:26:43.0765072002"
}
```

### 2. 调试发现

- ✅ 按钮点击事件正常触发
- ✅ Token存在且有效（`Token存在: true`）
- ✅ 请求成功到达后端
- ❌ 被TenantInterceptor拦截并返回403

---

## 🏗️ 权限认证架构分析

### 整体流程

```
用户请求
    ↓
【1】JwtAuthenticationFilter：提取JWT，验证并设置SecurityContext
    ↓
【2】TenantInterceptor：验证用户租户归属 ← 问题发生在这里
    ↓
【3】Controller：@PreAuthorize检查权限
    ↓
业务逻辑
```

### 1. JWT Token生成（JwtTokenService）

**位置**：`exam-application/src/main/java/com/duanruo/exam/application/service/JwtTokenService.java`

**机制**：
```java
// 第151-161行
private void addRolesAndPermissions(Map<String, Object> claims, Set<Role> roles) {
    claims.put("roles", roles.stream()
            .map(Role::getName)
            .collect(Collectors.toList()));  // ["SUPER_ADMIN"]

    claims.put("permissions", roles.stream()
            .flatMap(role -> role.getPermissions().stream())
            .map(Enum::name)
            .distinct()
            .collect(Collectors.toList()));  // ["TENANT_CREATE", "TENANT_UPDATE", ...]
}
```

**Token内容**：
```json
{
  "userId": "uuid",
  "username": "super_admin",
  "roles": ["SUPER_ADMIN"],
  "permissions": [
    "TENANT_CREATE",
    "TENANT_UPDATE",
    "TENANT_DELETE",
    "TENANT_VIEW",
    "TENANT_VIEW_ALL",
    "TENANT_ACTIVATE",
    "TENANT_DEACTIVATE",
    "EXAM_CREATE",
    "EXAM_UPDATE",
    ...
  ]
}
```

### 2. JWT认证过滤器（JwtAuthenticationFilter）

**位置**：`exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/security/JwtAuthenticationFilter.java`

**机制**：
```java
// 第87-94行：从JWT提取并转换为Spring Security的GrantedAuthority
List<SimpleGrantedAuthority> authorities = roles.stream()
        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))  // ROLE_SUPER_ADMIN
        .collect(Collectors.toList());

permissions.stream()
        .map(SimpleGrantedAuthority::new)  // TENANT_CREATE, TENANT_UPDATE等
        .forEach(authorities::add);
```

**结果**：SecurityContext中包含：
- `ROLE_SUPER_ADMIN`
- `TENANT_CREATE`
- `TENANT_UPDATE`
- `TENANT_DELETE`
- ... 等所有权限

### 3. 租户拦截器（TenantInterceptor） ← 问题所在

**位置**：`exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/TenantInterceptor.java`

#### 3.1 拦截逻辑

```java
// 第40-141行：preHandle方法
public boolean preHandle(HttpServletRequest request, ...) {
    // 1. 获取租户上下文
    TenantId tenantId = TenantContext.getCurrentTenant();

    // 2. 跳过某些路径的租户验证
    if (shouldSkipTenantValidation(request)) {
        return true;  // 跳过验证
    }

    // 3. 检查用户是否为超级管理员
    if (isSuperAdmin(user)) {
        return true;  // 超级管理员可以访问任何租户
    }

    // 4. 检查用户是否属于该租户
    boolean belongsToTenant = userTenantRoleRepository.belongsToTenant(userId, tenantId);

    if (!belongsToTenant) {
        // ❌ 返回403错误
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.getWriter().write("{\"error\":\"Forbidden\",\"message\":\"Access denied: User does not belong to this tenant\"...}");
        return false;
    }

    return true;
}
```

#### 3.2 跳过规则（修复前）

```java
// 第163-206行：shouldSkipTenantValidation方法
private boolean shouldSkipTenantValidation(HttpServletRequest request) {
    String path = request.getRequestURI();
    String ctx = request.getContextPath();  // "/api/v1"
    String rel = path.substring(ctx.length());  // 去除context-path

    // 1. 跳过认证相关的路径
    if (rel.startsWith("/auth/")) {
        return true;
    }

    // 2. 跳过租户管理API
    if (rel.matches("/tenants/?$") ||
        rel.matches("/tenants/[^/]+/?$") ||
        rel.matches("/tenants/slug/[^/]+/?$")) {
        return true;
    }
    // ❌ 问题：这里不匹配 "/super-admin/tenants"

    // 3. 跳过健康检查等公共端点
    if (rel.startsWith("/actuator/") || rel.startsWith("/health")) {
        return true;
    }

    // 4. 跳过公开考试API
    if (rel.matches("/exams/[^/]+/?$") || ...) {
        return true;
    }

    return false;
}
```

**问题分析**：
- 前端调用：`POST http://localhost:8081/api/v1/super-admin/tenants`
- 去除context-path后：`/super-admin/tenants`
- 正则`/tenants/?$`不匹配 → 继续执行租户验证
- 超级管理员可能没有`user_tenant_roles`记录 → 返回403

#### 3.3 修复方案

**文件**：`exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/TenantInterceptor.java`

**修改**：在第180-183行添加：
```java
// 2.1 跳过超级管理员专用API（在Controller层通过@PreAuthorize验证权限）
if (rel.startsWith("/super-admin/")) {
    return true;
}
```

**理由**：
1. **安全性**：`/super-admin/`路径下的所有API都在Controller层使用`@PreAuthorize("hasAuthority('TENANT_CREATE')")`等进行权限验证
2. **一致性**：与其他跳过规则（如`/auth/`）保持一致
3. **正确性**：超级管理员API不应该受租户归属限制

### 4. Controller权限验证（@PreAuthorize）

**位置**：`exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/controller/SuperAdminController.java`

**机制**：
```java
@RestController
@RequestMapping("/super-admin")
public class SuperAdminController {

    @PostMapping("/tenants")
    @PreAuthorize("hasAuthority('TENANT_CREATE')")  // ← 权限验证
    public ResponseEntity<TenantResponse> createTenant(@Valid @RequestBody CreateTenantRequest request) {
        // 业务逻辑
    }
}
```

**验证流程**：
1. Spring Security检查SecurityContext中的authorities
2. 查找是否包含`TENANT_CREATE`权限
3. SUPER_ADMIN角色包含此权限（Role.java第63行）
4. 验证通过，执行业务逻辑

---

## 🔐 权限系统设计分析

### 角色与权限映射

**文件**：`exam-domain/src/main/java/com/duanruo/exam/domain/user/Role.java`

#### SUPER_ADMIN角色权限（第29-130行）

```java
public static final Role SUPER_ADMIN = new Role(
    "SUPER_ADMIN",
    "超级管理员 - 拥有所有权限，可以创建和管理所有考试",
    Set.of(
        // 租户管理权限
        Permission.TENANT_CREATE,       // ✅ 创建租户
        Permission.TENANT_UPDATE,       // ✅ 更新租户
        Permission.TENANT_DELETE,       // ✅ 删除租户
        Permission.TENANT_VIEW,         // ✅ 查看租户
        Permission.TENANT_VIEW_ALL,     // ✅ 查看所有租户
        Permission.TENANT_ACTIVATE,     // ✅ 激活租户
        Permission.TENANT_DEACTIVATE,   // ✅ 停用租户

        // 考试管理权限
        Permission.EXAM_CREATE,
        Permission.EXAM_UPDATE,
        Permission.EXAM_DELETE,
        Permission.EXAM_VIEW,

        // ... 其他120+项权限
    )
);
```

### 权限检查机制

#### 1. 基于角色的检查（TenantInterceptor）

```java
// 第156-158行
private boolean isSuperAdmin(User user) {
    return user.getRoles().contains(Role.SUPER_ADMIN);
}
```

#### 2. 基于权限的检查（@PreAuthorize）

```java
// Controller层
@PreAuthorize("hasAuthority('TENANT_CREATE')")
```

**两种机制的关系**：
- TenantInterceptor：**租户归属检查** - 确保用户有权访问当前租户的数据
- @PreAuthorize：**操作权限检查** - 确保用户有权执行特定操作

**Super Admin的特殊处理**：
- ✅ 绕过租户归属检查（第100-104行）
- ✅ 包含所有操作权限（Role.java）
- ✅ 可以访问任何租户

---

## 🚨 潜在的其他问题

### 检查结果：所有路径跳过规则正确

| 路径模式 | Controller | 是否跳过租户验证 | 验证方式 |
|---------|-----------|---------------|---------|
| `/auth/**` | AuthController | ✅ 是 | 第171-173行 |
| `/super-admin/**` | SuperAdminController | ✅ 是（已修复） | 第180-183行 |
| `/tenants/**` | TenantController | ✅ 是 | 第176-178行 |
| `/actuator/**` | - | ✅ 是 | 第186-188行 |
| `/exams/{id}` | ExamController | ✅ 是 | 第187-191行 |
| `/applications` (POST) | ApplicationController | ✅ 特殊处理 | 第195-203行 |
| `/public/**` | - | ❌ 否 | 未找到规则 |

### 建议：添加/public/路径跳过

**当前问题**：`PublicExamController`使用`@RequestMapping("/public/exams")`，但TenantInterceptor未跳过`/public/`路径。

**影响评估**：
- 如果PublicExamController的API需要匿名访问 → 需要添加跳过规则
- 如果需要认证但不需要租户归属 → 需要添加跳过规则

**建议修改**：
```java
// 在shouldSkipTenantValidation方法中添加：
// 6. 跳过公开API
if (rel.startsWith("/public/")) {
    return true;
}
```

---

## ✅ 修复验证清单

### 已完成的修复

- [x] **TenantInterceptor添加/super-admin/路径跳过**
  - 文件：`exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/TenantInterceptor.java`
  - 行号：180-183
  - 修改内容：
    ```java
    // 2.1 跳过超级管理员专用API（在Controller层通过@PreAuthorize验证权限）
    if (rel.startsWith("/super-admin/")) {
        return true;
    }
    ```

### 需要验证的内容

- [ ] **重启后端服务器**
  ```bash
  cd exam-bootstrap
  mvn spring-boot:run
  ```

- [ ] **测试创建租户功能**
  1. 登录超级管理员账号
  2. 访问 http://localhost:3000/super-admin/tenants
  3. 点击"创建租户"按钮
  4. 填写表单并点击"保存"
  5. 验证是否成功创建租户

- [ ] **检查控制台日志**
  - 应该看到："Skipping tenant validation for path: /super-admin/tenants"
  - 不应该看到："Access denied: User does not belong to this tenant"

### 可选的改进

- [ ] **添加/public/路径跳过**（如果PublicExamController需要）
- [ ] **添加单元测试**
  - 测试TenantInterceptor.shouldSkipTenantValidation()
  - 测试超级管理员创建租户的完整流程

---

## 📊 权限系统架构总结

### 三层防护机制

```
┌─────────────────────────────────────────┐
│  1. JWT认证层（JwtAuthenticationFilter） │
│     - 验证Token有效性                     │
│     - 提取roles和permissions            │
│     - 设置SecurityContext               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  2. 租户隔离层（TenantInterceptor）      │
│     - 验证用户租户归属                   │
│     - 超级管理员绕过检查                 │
│     - 特定路径跳过验证                   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  3. 操作权限层（@PreAuthorize）          │
│     - 检查具体操作权限                   │
│     - 基于JWT中的permissions            │
│     - 细粒度权限控制                     │
└─────────────────────────────────────────┘
```

### 设计优点

✅ **分层清晰**：认证、租户隔离、权限验证三层分离

✅ **权限细粒度**：120+项细粒度权限，支持精确控制

✅ **角色灵活**：支持全局角色（SUPER_ADMIN）和租户角色（TENANT_ADMIN等）

✅ **SSO友好**：用户可以跨租户使用（通过UserTenantRole）

✅ **安全性高**：默认拒绝+白名单机制

### 设计建议

⚠️ **路径跳过规则维护**：
- 当前跳过规则分散在代码中（正则、startsWith等）
- 建议：集中配置（如YAML文件）或使用注解标记

⚠️ **文档完整性**：
- TenantInterceptor的跳过规则缺少文档说明
- 建议：在代码注释中说明每条规则的原因和影响

⚠️ **测试覆盖率**：
- TenantInterceptor缺少单元测试
- 建议：添加测试覆盖所有跳过规则

---

## 🎯 结论

### 问题根源

TenantInterceptor的`shouldSkipTenantValidation`方法未包含`/super-admin/`路径，导致超级管理员API被租户归属检查阻拦。

### 修复方案

在TenantInterceptor中添加对`/super-admin/`路径的跳过验证，在Controller层通过`@PreAuthorize`验证权限。

### 权限系统健康度

| 项目 | 评分 | 说明 |
|------|------|------|
| 架构设计 | ⭐⭐⭐⭐⭐ 5/5 | 三层防护，职责分离清晰 |
| 权限粒度 | ⭐⭐⭐⭐⭐ 5/5 | 120+项细粒度权限 |
| 安全性 | ⭐⭐⭐⭐ 4/5 | 默认拒绝，但跳过规则需完善 |
| 可维护性 | ⭐⭐⭐ 3/5 | 跳过规则分散，缺少文档 |
| 测试覆盖 | ⭐⭐ 2/5 | 缺少TenantInterceptor测试 |

**总体评价**：权限系统基础架构扎实，只需修复路径跳过规则配置问题。

---

**报告生成时间**：2025-11-22
**分析人员**：Claude Code
**相关文件**：
- `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/TenantInterceptor.java`
- `exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/security/JwtAuthenticationFilter.java`
- `exam-application/src/main/java/com/duanruo/exam/application/service/JwtTokenService.java`
- `exam-domain/src/main/java/com/duanruo/exam/domain/user/Role.java`
- `exam-adapter-rest/src/main/java/com/duanruo/exam/adapter/rest/controller/SuperAdminController.java`
