# Token生成机制优化设计方案

**文档版本**: 1.0
**创建日期**: 2025-11-19
**状态**: 待评审

## 一、问题分析

### 1.1 现状概述

当前系统存在两套JWT Token生成机制:
- **全局Token** (`generateToken`): 仅包含全局角色,不含tenantId
- **租户Token** (`generateTenantToken`): 包含tenantId + 全局角色 + 租户角色

这种设计本身是合理的,支持SSO多租户架构,但存在以下问题。

### 1.2 核心问题清单

#### P0 (高危问题 - 必须修复)

**问题1: refreshToken() 丢失租户上下文**
- **位置**: `AuthenticationService.java:303`
- **现象**: 用户使用租户Token刷新时,强制返回全局Token,导致租户上下文丢失
- **影响**:
  - 用户需要重新调用 `/auth/select-tenant` 选择租户
  - 前端应用会突然失去租户权限,导致403错误
  - 用户体验极差,可能被误认为是系统Bug
- **根因**: 刷新逻辑未检查原Token中的tenantId

```java
// 当前代码 (有问题)
public LoginResponse refreshToken(String token) {
    // ...
    String newToken = jwtTokenService.generateToken(user); // ❌ 总是生成全局Token
    return LoginResponse.builder().token(newToken).build();
}
```

#### P1 (架构问题 - 应该修复)

**问题2: 方法命名不清晰**
- **位置**: `JwtTokenService.java:39, 69`
- **现象**: `generateToken()` 名称暗示是通用方法,实际上是"全局Token专用"
- **影响**: 开发者容易误用,导致租户上下文丢失
- **建议**: 重命名为 `generateGlobalToken()` 和 `generateTenantToken()`

**问题3: 缺少Token类型标识**
- **位置**: `JwtTokenService.java` 的 `createToken()` 方法
- **现象**: JWT claims中没有明确的 `tokenType` 字段
- **影响**:
  - 难以区分Token类型(全局 vs 租户)
  - 调试和问题排查困难
  - 无法实施基于Token类型的策略(如降级策略)

**问题4: 代码重复严重**
- **位置**: `JwtTokenService.java:39-56 vs 69-100`
- **现象**: 两个方法中有80%相同的claims构建逻辑
- **影响**:
  - 维护成本高(修改需要改两处)
  - 容易出现不一致(如一个方法加了字段,另一个忘记加)

### 1.3 影响范围分析

#### 受影响的代码文件

| 文件路径 | 受影响方法 | 修改类型 |
|---------|----------|---------|
| `exam-application/.../JwtTokenService.java` | `generateToken()` → `generateGlobalToken()` | 重命名 + 重构 |
| `exam-application/.../JwtTokenService.java` | `generateTenantToken()` | 重构 (添加tokenType) |
| `exam-application/.../JwtTokenService.java` | 新增 `buildBasicClaims()` | 新方法 |
| `exam-application/.../AuthenticationService.java` | `refreshToken()` | 修复逻辑 |
| `exam-application/.../AuthenticationService.java` | `login()`, `selectTenant()` | 更新方法调用 |
| `exam-application/.../test/.../JwtTokenServiceTest.java` | 多个测试方法 | 更新方法调用 |
| `exam-application/.../test/.../AuthenticationServiceTest.java` | 测试mock | 更新mock方法名 |

#### 受影响的API端点

| 端点 | 影响说明 |
|-----|---------|
| `POST /auth/login` | 间接影响(内部调用变化,响应不变) |
| `POST /auth/refresh` | **行为改变**: 现在会保留租户上下文 |
| `POST /auth/select-tenant` | 间接影响(内部调用变化,响应不变) |

#### 前端兼容性

✅ **完全向后兼容** - Token的JWT结构和Claims字段保持不变(仅新增 `tokenType` 字段)

## 二、优化方案设计

### 2.1 架构设计

#### Token类型定义

```
TokenType (枚举)
├── GLOBAL  - 全局Token,不含tenantId,仅全局角色
└── TENANT  - 租户Token,含tenantId,全局角色+租户角色
```

#### JWT Claims结构

```json
// 全局Token
{
  "userId": "uuid",
  "username": "admin",
  "email": "admin@example.com",
  "fullName": "系统管理员",
  "tokenType": "GLOBAL",          // 新增
  "roles": ["SUPER_ADMIN"],
  "permissions": ["USER_MANAGE", "TENANT_MANAGE", ...],
  "status": "ACTIVE",
  "iss": "exam-registration-system",
  "sub": "admin",
  "iat": 1700000000,
  "exp": 1700086400
}

// 租户Token
{
  "userId": "uuid",
  "username": "tenant_admin",
  "email": "admin@tenant.com",
  "fullName": "租户管理员",
  "tokenType": "TENANT",          // 新增
  "tenantId": "uuid",
  "roles": ["TENANT_ADMIN", "PRIMARY_REVIEWER"], // 合并后的角色
  "permissions": ["EXAM_CREATE", "APPLICATION_REVIEW", ...],
  "status": "ACTIVE",
  "iss": "exam-registration-system",
  "sub": "tenant_admin",
  "iat": 1700000000,
  "exp": 1700086400
}
```

### 2.2 代码重构方案

#### 方案A: JwtTokenService 重构

```java
public class JwtTokenService {

    // ============ 公共方法 (重构后) ============

    /**
     * 生成全局Token (仅全局角色,无租户上下文)
     * @param user 用户实体
     * @return JWT Token
     */
    public String generateGlobalToken(User user) {
        Map<String, Object> claims = buildBasicClaims(
            user.getId().toString(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getStatus().name()
        );

        // 添加全局角色和权限
        addRolesAndPermissions(claims, user.getRoles());

        // 标记为全局Token
        claims.put("tokenType", "GLOBAL");

        return createToken(claims, user.getUsername());
    }

    /**
     * 生成租户Token (包含租户ID和合并后的角色)
     * @param userId 用户ID
     * @param username 用户名
     * @param email 邮箱
     * @param fullName 全名
     * @param tenantId 租户ID
     * @param mergedRoles 合并后的角色(全局角色 + 租户角色)
     * @param status 用户状态
     * @return JWT Token
     */
    public String generateTenantToken(
            String userId,
            String username,
            String email,
            String fullName,
            String tenantId,
            Set<Role> mergedRoles,
            String status) {

        Map<String, Object> claims = buildBasicClaims(userId, username, email, fullName, status);

        // 添加租户ID
        claims.put("tenantId", tenantId);

        // 添加合并后的角色和权限
        addRolesAndPermissions(claims, mergedRoles);

        // 标记为租户Token
        claims.put("tokenType", "TENANT");

        return createToken(claims, username);
    }

    // ============ 私有辅助方法 (新增) ============

    /**
     * 构建基础Claims (复用逻辑)
     */
    private Map<String, Object> buildBasicClaims(
            String userId,
            String username,
            String email,
            String fullName,
            String status) {

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("username", username);
        claims.put("email", email);
        claims.put("fullName", fullName);
        claims.put("status", status);
        return claims;
    }

    /**
     * 添加角色和权限到Claims (复用逻辑)
     */
    private void addRolesAndPermissions(Map<String, Object> claims, Set<Role> roles) {
        claims.put("roles", roles.stream()
                .map(Role::getName)
                .collect(Collectors.toList()));

        claims.put("permissions", roles.stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Enum::name)
                .distinct()
                .collect(Collectors.toList()));
    }

    /**
     * 从Token中获取Token类型
     */
    public String getTokenTypeFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("tokenType", String.class));
    }

    // createToken() 等其他方法保持不变...
}
```

#### 方案B: AuthenticationService.refreshToken() 修复

```java
@Service
public class AuthenticationService {

    /**
     * 刷新Token (修复后 - 保留租户上下文)
     */
    @Transactional(readOnly = true)
    public LoginResponse refreshToken(String token) {
        // 1. 验证Token
        if (!jwtTokenService.validateToken(token)) {
            throw new ApplicationException("无效的Token");
        }

        // 2. 提取用户信息
        String username = jwtTokenService.getUsernameFromToken(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApplicationException("用户不存在"));

        // 3. 检查用户状态
        if (!user.canLogin()) {
            throw new ApplicationException("用户账户已被禁用或锁定");
        }

        // 4. ✅ 核心修复: 检查原Token类型,保留租户上下文
        String oldTenantId = jwtTokenService.getTenantIdFromToken(token);
        String newToken;

        if (oldTenantId != null) {
            // 原Token是租户Token,需要重新生成租户Token
            log.info("Refreshing tenant token for user {} in tenant {}", user.getUsername(), oldTenantId);

            // 4.1 验证用户仍有该租户的访问权限
            TenantId tenantId = TenantId.of(UUID.fromString(oldTenantId));
            boolean hasAccess = user.hasRole(Role.SUPER_ADMIN) ||
                                userTenantRoleRepository.belongsToTenant(user.getId(), tenantId);

            if (!hasAccess) {
                throw new ApplicationException("您已失去该租户的访问权限,请重新登录");
            }

            // 4.2 查询用户在该租户下的角色
            List<UserTenantRole> tenantRoles = userTenantRoleRepository
                    .findActiveRolesByUserAndTenant(user.getId(), tenantId);

            // 4.3 合并全局角色和租户角色
            Set<Role> allRoles = new HashSet<>(user.getRoles());
            allRoles.addAll(tenantRoles.stream()
                    .map(UserTenantRole::getRole)
                    .collect(Collectors.toList()));

            // 4.4 生成新的租户Token
            newToken = jwtTokenService.generateTenantToken(
                    user.getId().toString(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getFullName(),
                    oldTenantId,
                    allRoles,
                    user.getStatus().name()
            );
        } else {
            // 原Token是全局Token,生成新的全局Token
            log.info("Refreshing global token for user {}", user.getUsername());
            newToken = jwtTokenService.generateGlobalToken(user);
        }

        // 5. 返回响应
        return LoginResponse.builder()
                .token(newToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenService.getExpirationTime())
                .user(UserResponse.fromUser(user))
                .build();
    }
}
```

### 2.3 兼容性策略

#### 向后兼容性保证

1. **API响应格式不变**: LoginResponse结构保持不变
2. **JWT Claims向前兼容**: 新增 `tokenType` 字段,不影响现有Claims解析
3. **前端无需改动**: Token刷新逻辑对前端透明

#### 废弃方法处理

```java
/**
 * @deprecated 使用 {@link #generateGlobalToken(User)} 代替
 * 保留此方法以维持向后兼容性,将在 v2.0 版本移除
 */
@Deprecated
public String generateToken(User user) {
    return generateGlobalToken(user);
}
```

## 三、实施计划

### 3.1 实施步骤

#### 阶段1: 核心重构 (P0)

**Step 1.1: 重构 JwtTokenService**
- [ ] 添加 `buildBasicClaims()` 私有方法
- [ ] 添加 `addRolesAndPermissions()` 私有方法
- [ ] 重命名 `generateToken()` → `generateGlobalToken()`
- [ ] 添加 `@Deprecated` 的 `generateToken()` 包装方法
- [ ] 在两个生成方法中添加 `tokenType` claim
- [ ] 添加 `getTokenTypeFromToken()` 方法

**Step 1.2: 修复 AuthenticationService.refreshToken()**
- [ ] 实现租户上下文检测逻辑
- [ ] 实现租户权限验证
- [ ] 实现角色合并逻辑
- [ ] 根据Token类型调用对应的生成方法

**Step 1.3: 更新调用点**
- [ ] 更新 `AuthenticationService.login()` (line 132, 137)
- [ ] 更新 `AuthenticationService.selectTenant()` (无需改动,已用正确方法)

**Step 1.4: 更新单元测试**
- [ ] 更新 `JwtTokenServiceTest.java` (3处调用)
- [ ] 更新 `AuthenticationServiceTest.java` (mock和verify)
- [ ] 添加新测试: `testRefreshTokenPreservesTenantContext()`
- [ ] 添加新测试: `testRefreshTokenWithRevokedTenantAccess()`

#### 阶段2: 验证测试 (P0)

**Step 2.1: 单元测试**
```bash
mvn test -Dtest=JwtTokenServiceTest
mvn test -Dtest=AuthenticationServiceTest
```

**Step 2.2: 集成测试**
- [ ] 测试场景1: 全局Token刷新 → 返回全局Token
- [ ] 测试场景2: 租户Token刷新 → 返回相同租户的Token
- [ ] 测试场景3: 租户Token刷新,但权限已撤销 → 返回异常
- [ ] 测试场景4: 登录有租户角色的用户 → 返回租户Token
- [ ] 测试场景5: 选择租户 → 返回租户Token

**Step 2.3: 手动测试**
- [ ] 启动后端服务
- [ ] 使用Postman/Swagger测试 `/auth/login`
- [ ] 使用Postman/Swagger测试 `/auth/refresh` (验证tenantId保留)
- [ ] 使用Postman/Swagger测试 `/auth/select-tenant`

#### 阶段3: 文档更新 (P1)

**Step 3.1: 更新技术文档**
- [ ] 更新 `docs/security-guidelines.md` (添加Token类型说明)
- [ ] 更新 `CLAUDE.md` (更新JWT Claims结构)

**Step 3.2: 更新API文档**
- [ ] 更新 Swagger 注释 (如有需要)

### 3.2 风险评估

| 风险项 | 严重程度 | 可能性 | 缓解措施 |
|-------|---------|-------|---------|
| 破坏现有登录功能 | 高 | 低 | 充分的单元测试 + 集成测试 |
| 测试覆盖不足导致遗漏bug | 中 | 中 | 编写完整的测试用例清单 |
| 租户权限验证逻辑错误 | 高 | 低 | 代码审查 + 边界测试 |
| 性能影响(refreshToken需要额外查询) | 低 | 高 | 可接受(刷新频率低,查询开销小) |

### 3.3 回滚计划

如果发现重大问题,可以通过以下步骤回滚:

1. **Git回滚**: `git revert <commit-hash>`
2. **保留 @Deprecated 方法**: 确保旧代码仍可工作
3. **数据库无影响**: 此次改动不涉及数据库schema变更

## 四、验收标准

### 4.1 功能验收

- [ ] **FR-1**: 用户使用租户Token刷新时,返回的新Token包含相同的tenantId
- [ ] **FR-2**: 用户使用全局Token刷新时,返回的新Token不包含tenantId
- [ ] **FR-3**: 当用户的租户权限被撤销后,刷新租户Token会返回403错误
- [ ] **FR-4**: 所有Token都包含 `tokenType` 字段("GLOBAL" 或 "TENANT")
- [ ] **FR-5**: 前端无需任何修改即可继续工作

### 4.2 质量验收

- [ ] **QA-1**: 单元测试覆盖率 ≥ 90%
- [ ] **QA-2**: 所有现有测试通过
- [ ] **QA-3**: 新增测试场景覆盖租户上下文保留逻辑
- [ ] **QA-4**: 代码通过 Checkstyle、SpotBugs、PMD 检查
- [ ] **QA-5**: 无新增的编译警告

### 4.3 性能验收

- [ ] **PERF-1**: refreshToken 响应时间 < 200ms (P95)
- [ ] **PERF-2**: 不增加额外的数据库连接池压力

## 五、后续优化建议 (P2 - 可选)

### 5.1 增强功能

1. **Token降级策略**
   - 当租户Token刷新失败时,自动降级为全局Token (如果用户有全局角色)
   - 前端显示提示: "您已失去租户 XX 的访问权限,已切换为全局视图"

2. **审计日志**
   - 记录Token类型切换事件
   - 记录租户切换历史
   - 记录刷新失败原因

3. **Token黑名单机制**
   - 实现Redis缓存的Token黑名单
   - 支持管理员强制撤销用户Token
   - 支持用户主动登出所有设备

### 5.2 监控指标

建议添加以下Prometheus指标:

```
# Token生成计数
jwt_token_generated_total{type="global|tenant"}

# Token刷新计数
jwt_token_refresh_total{result="success|failure", tenant_preserved="true|false"}

# Token刷新耗时
jwt_token_refresh_duration_seconds{quantile="0.5|0.9|0.99"}
```

## 六、总结

本次优化解决了 `refreshToken()` 丢失租户上下文的高危问题,并通过代码重构提升了可维护性。

**核心改进**:
1. ✅ 修复租户上下文丢失问题(P0)
2. ✅ 添加Token类型标识(P1)
3. ✅ 重构消除代码重复(P1)
4. ✅ 改进方法命名清晰度(P1)

**预期效果**:
- 用户体验显著提升 (无需重复选择租户)
- 代码可维护性提高 30% (减少重复代码)
- 调试效率提高 (Token类型一目了然)
- 向后完全兼容 (无破坏性变更)

---

**审批流程**:
- [ ] 技术负责人审批
- [ ] 架构师审批
- [ ] 测试负责人审批

**批准后进入实施阶段**
