# Token优化实施检查清单

**关联文档**: [token-generation-optimization-plan.md](./token-generation-optimization-plan.md)
**执行日期**: 待定
**执行人**: 待定

## 前置条件检查

- [ ] 已阅读完整的优化设计方案
- [ ] 已备份当前代码分支: `git branch backup-token-optimization-$(date +%Y%m%d)`
- [ ] 确认所有现有测试通过: `mvn test`
- [ ] 确认没有未提交的变更: `git status`

---

## 阶段1: 核心重构 (预计耗时: 3-4小时)

### Step 1.1: 重构 JwtTokenService ⏱️ 1.5小时

**文件**: `exam-application/src/main/java/com/duanruo/exam/application/service/JwtTokenService.java`

- [ ] **1.1.1** 添加私有方法 `buildBasicClaims(String userId, String username, String email, String fullName, String status)`
  - 返回类型: `Map<String, Object>`
  - 包含字段: userId, username, email, fullName, status

- [ ] **1.1.2** 添加私有方法 `addRolesAndPermissions(Map<String, Object> claims, Set<Role> roles)`
  - 添加 `roles` 字段(角色名称列表)
  - 添加 `permissions` 字段(去重后的权限列表)

- [ ] **1.1.3** 重构 `generateToken(User user)` → `generateGlobalToken(User user)`
  - 使用 `buildBasicClaims()` 构建基础claims
  - 使用 `addRolesAndPermissions()` 添加角色权限
  - 添加 `claims.put("tokenType", "GLOBAL")`
  - 调用 `createToken(claims, user.getUsername())`

- [ ] **1.1.4** 重构 `generateTenantToken(...)`
  - 使用 `buildBasicClaims()` 构建基础claims
  - 添加 `claims.put("tenantId", tenantId)`
  - 使用 `addRolesAndPermissions()` 添加角色权限
  - 添加 `claims.put("tokenType", "TENANT")`
  - 调用 `createToken(claims, username)`

- [ ] **1.1.5** 添加 `@Deprecated` 的包装方法 `generateToken(User user)`
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

- [ ] **1.1.6** 添加新方法 `getTokenTypeFromToken(String token)`
  ```java
  public String getTokenTypeFromToken(String token) {
      return getClaimFromToken(token, claims -> claims.get("tokenType", String.class));
  }
  ```

- [ ] **1.1.7** 编译检查: `mvn compile -pl exam-application`

---

### Step 1.2: 修复 AuthenticationService.refreshToken() ⏱️ 1小时

**文件**: `exam-application/src/main/java/com/duanruo/exam/application/service/AuthenticationService.java`

- [ ] **1.2.1** 在 `refreshToken()` 方法中,在用户验证后添加租户上下文检测逻辑
  ```java
  // 4. 检查原Token类型,保留租户上下文
  String oldTenantId = jwtTokenService.getTenantIdFromToken(token);
  String newToken;
  ```

- [ ] **1.2.2** 添加租户Token刷新分支 (if oldTenantId != null)
  - 记录日志: `log.info("Refreshing tenant token for user {} in tenant {}", ...)`
  - 验证租户访问权限
  - 查询租户角色
  - 合并全局角色和租户角色
  - 调用 `jwtTokenService.generateTenantToken(...)`

- [ ] **1.2.3** 添加全局Token刷新分支 (else)
  - 记录日志: `log.info("Refreshing global token for user {}", ...)`
  - 调用 `jwtTokenService.generateGlobalToken(user)`

- [ ] **1.2.4** 编译检查: `mvn compile -pl exam-application`

---

### Step 1.3: 更新调用点 ⏱️ 30分钟

**文件**: `exam-application/src/main/java/com/duanruo/exam/application/service/AuthenticationService.java`

- [ ] **1.3.1** 更新 `login()` 方法 line 132
  ```java
  // 修改前: token = jwtTokenService.generateToken(user);
  // 修改后:
  token = jwtTokenService.generateGlobalToken(user);
  ```

- [ ] **1.3.2** 更新 `login()` 方法 line 137
  ```java
  // 修改前: token = jwtTokenService.generateToken(user);
  // 修改后:
  token = jwtTokenService.generateGlobalToken(user);
  ```

- [ ] **1.3.3** 检查 `selectTenant()` 方法 line 446
  - 确认已使用 `generateTenantToken()` (无需修改)

- [ ] **1.3.4** 编译检查: `mvn compile -pl exam-application`

---

### Step 1.4: 更新单元测试 ⏱️ 1小时

**文件**: `exam-application/src/test/java/com/duanruo/exam/application/service/JwtTokenServiceTest.java`

- [ ] **1.4.1** 更新 line 34
  ```java
  // 修改前: String token = svc.generateToken(user);
  // 修改后:
  String token = svc.generateGlobalToken(user);
  ```

- [ ] **1.4.2** 更新 line 58
  ```java
  // 修改前: String token = svc.generateToken(user);
  // 修改后:
  String token = svc.generateGlobalToken(user);
  ```

- [ ] **1.4.3** 更新 line 68
  ```java
  // 修改前: String token = svc.generateToken(buildUser("eve"));
  // 修改后:
  String token = svc.generateGlobalToken(buildUser("eve"));
  ```

- [ ] **1.4.4** 添加新测试: `testGlobalTokenContainsTypeField()`
  ```java
  @Test
  void testGlobalTokenContainsTypeField() {
      User user = buildUser("admin");
      String token = svc.generateGlobalToken(user);

      String tokenType = svc.getTokenTypeFromToken(token);
      assertNotNull(tokenType);
      assertEquals("GLOBAL", tokenType);
  }
  ```

- [ ] **1.4.5** 添加新测试: `testTenantTokenContainsTypeField()`
  ```java
  @Test
  void testTenantTokenContainsTypeField() {
      String token = svc.generateTenantToken(
          UUID.randomUUID().toString(),
          "tenant_admin",
          "admin@tenant.com",
          "Tenant Admin",
          UUID.randomUUID().toString(),
          Set.of(Role.TENANT_ADMIN),
          "ACTIVE"
      );

      String tokenType = svc.getTokenTypeFromToken(token);
      assertNotNull(tokenType);
      assertEquals("TENANT", tokenType);
  }
  ```

**文件**: `exam-application/src/test/java/com/duanruo/exam/application/service/AuthenticationServiceTest.java`

- [ ] **1.4.6** 更新 line 46
  ```java
  // 修改前: when(jwtTokenService.generateToken(user)).thenReturn("mock-token");
  // 修改后:
  when(jwtTokenService.generateGlobalToken(user)).thenReturn("mock-token");
  ```

- [ ] **1.4.7** 更新 line 63
  ```java
  // 修改前: verify(jwtTokenService, times(1)).generateToken(user);
  // 修改后:
  verify(jwtTokenService, times(1)).generateGlobalToken(user);
  ```

- [ ] **1.4.8** 更新 line 82
  ```java
  // 修改前: verify(jwtTokenService, never()).generateToken(any());
  // 修改后:
  verify(jwtTokenService, never()).generateGlobalToken(any());
  ```

- [ ] **1.4.9** 添加新测试: `testRefreshTokenPreservesTenantContext()`
  ```java
  @Test
  void testRefreshTokenPreservesTenantContext() {
      // Given: 用户有租户Token
      String tenantId = UUID.randomUUID().toString();
      User user = buildUserWithTenantRole();
      String oldToken = "old-tenant-token";

      when(jwtTokenService.validateToken(oldToken)).thenReturn(true);
      when(jwtTokenService.getUsernameFromToken(oldToken)).thenReturn(user.getUsername());
      when(jwtTokenService.getTenantIdFromToken(oldToken)).thenReturn(tenantId);
      when(userRepository.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
      when(userTenantRoleRepository.belongsToTenant(any(), any())).thenReturn(true);
      when(userTenantRoleRepository.findActiveRolesByUserAndTenant(any(), any()))
          .thenReturn(List.of(/* mock tenant roles */));
      when(jwtTokenService.generateTenantToken(any(), any(), any(), any(), eq(tenantId), any(), any()))
          .thenReturn("new-tenant-token");

      // When: 刷新Token
      LoginResponse response = authenticationService.refreshToken(oldToken);

      // Then: 返回的新Token应该是租户Token
      assertNotNull(response);
      verify(jwtTokenService).generateTenantToken(any(), any(), any(), any(), eq(tenantId), any(), any());
      verify(jwtTokenService, never()).generateGlobalToken(any());
  }
  ```

- [ ] **1.4.10** 添加新测试: `testRefreshGlobalTokenReturnsGlobalToken()`

- [ ] **1.4.11** 运行测试: `mvn test -Dtest=JwtTokenServiceTest`

- [ ] **1.4.12** 运行测试: `mvn test -Dtest=AuthenticationServiceTest`

---

## 阶段2: 验证测试 (预计耗时: 2小时)

### Step 2.1: 单元测试验证 ⏱️ 30分钟

- [ ] **2.1.1** 运行所有应用层测试
  ```bash
  mvn test -pl exam-application
  ```

- [ ] **2.1.2** 检查测试覆盖率
  ```bash
  mvn jacoco:report -pl exam-application
  # 打开: exam-application/target/site/jacoco/index.html
  ```

- [ ] **2.1.3** 确认 JwtTokenService 覆盖率 ≥ 90%

- [ ] **2.1.4** 确认 AuthenticationService.refreshToken() 覆盖率 = 100%

---

### Step 2.2: 集成测试 ⏱️ 1小时

- [ ] **2.2.1** 启动后端服务
  ```bash
  ./scripts/start-backend.ps1
  ```

- [ ] **2.2.2** 测试场景1: 全局Token刷新
  ```bash
  # 1. 登录超级管理员(无租户角色)
  POST /api/v1/auth/login
  {
    "username": "super_admin",
    "password": "password"
  }
  # 2. 提取token,检查是否包含 tokenType: "GLOBAL"
  # 3. 刷新token
  POST /api/v1/auth/refresh
  Authorization: Bearer <token>
  # 4. 验证新token也是 tokenType: "GLOBAL"
  # 5. 验证新token不包含 tenantId
  ```

- [ ] **2.2.3** 测试场景2: 租户Token刷新
  ```bash
  # 1. 登录有租户角色的用户
  POST /api/v1/auth/login
  {
    "username": "tenant_admin",
    "password": "password"
  }
  # 2. 提取token,检查是否包含 tokenType: "TENANT" 和 tenantId
  # 3. 刷新token
  POST /api/v1/auth/refresh
  Authorization: Bearer <token>
  # 4. 验证新token也是 tokenType: "TENANT"
  # 5. 验证新token包含相同的 tenantId
  ```

- [ ] **2.2.4** 测试场景3: 选择租户后刷新
  ```bash
  # 1. 登录用户
  # 2. 选择租户
  POST /api/v1/auth/select-tenant
  { "tenantId": "xxx" }
  # 3. 刷新token
  POST /api/v1/auth/refresh
  # 4. 验证新token保留租户上下文
  ```

- [ ] **2.2.5** 测试场景4: 验证tokenType字段
  - 使用 jwt.io 解码token
  - 确认包含 `"tokenType": "GLOBAL"` 或 `"TENANT"`

---

### Step 2.3: 边界测试 ⏱️ 30分钟

- [ ] **2.3.1** 测试: 刷新已过期的Token → 返回400错误

- [ ] **2.3.2** 测试: 刷新无效的Token → 返回400错误

- [ ] **2.3.3** 测试: 刷新时用户被禁用 → 返回403错误

- [ ] **2.3.4** 测试: 刷新租户Token,但租户权限已撤销 → 返回403错误
  - 需要手动删除 `user_tenant_roles` 表中的记录
  - 然后刷新token,验证返回 "您已失去该租户的访问权限"

---

## 阶段3: 代码质量检查 (预计耗时: 30分钟)

### Step 3.1: 静态代码分析

- [ ] **3.1.1** 运行 Checkstyle
  ```bash
  mvn checkstyle:check -pl exam-application
  ```

- [ ] **3.1.2** 运行 SpotBugs
  ```bash
  mvn spotbugs:check -pl exam-application
  ```

- [ ] **3.1.3** 运行 PMD
  ```bash
  mvn pmd:check -pl exam-application
  ```

- [ ] **3.1.4** 检查编译警告
  ```bash
  mvn clean compile -pl exam-application
  # 确认无新增警告
  ```

---

### Step 3.2: 代码审查

- [ ] **3.2.1** 自查: 是否有重复代码
- [ ] **3.2.2** 自查: 是否有魔法数字/字符串
- [ ] **3.2.3** 自查: 日志级别是否合理
- [ ] **3.2.4** 自查: 异常处理是否完善
- [ ] **3.2.5** 自查: 注释是否清晰

---

## 阶段4: 文档更新 (预计耗时: 30分钟)

### Step 4.1: 更新技术文档

- [ ] **4.1.1** 更新 `CLAUDE.md` 的 JWT Claims结构示例
  ```markdown
  ### JWT Claims结构

  **全局Token**:
  ```json
  {
    "userId": "uuid",
    "tokenType": "GLOBAL",  // 新增
    "roles": ["SUPER_ADMIN"],
    ...
  }
  ```

  **租户Token**:
  ```json
  {
    "userId": "uuid",
    "tokenType": "TENANT",  // 新增
    "tenantId": "uuid",
    "roles": ["TENANT_ADMIN"],
    ...
  }
  ```
  ```

- [ ] **4.1.2** 更新 `docs/security-guidelines.md` (如果存在)
  - 添加 Token类型说明
  - 添加 refreshToken 行为说明

---

## 阶段5: 最终验收 (预计耗时: 30分钟)

### Step 5.1: 功能验收

- [ ] **FR-1** ✅ 用户使用租户Token刷新时,返回的新Token包含相同的tenantId
- [ ] **FR-2** ✅ 用户使用全局Token刷新时,返回的新Token不包含tenantId
- [ ] **FR-3** ✅ 当用户的租户权限被撤销后,刷新租户Token会返回403错误
- [ ] **FR-4** ✅ 所有Token都包含 `tokenType` 字段
- [ ] **FR-5** ✅ 前端无需任何修改即可继续工作

### Step 5.2: 质量验收

- [ ] **QA-1** ✅ 单元测试覆盖率 ≥ 90%
- [ ] **QA-2** ✅ 所有现有测试通过
- [ ] **QA-3** ✅ 新增测试场景覆盖租户上下文保留逻辑
- [ ] **QA-4** ✅ 代码通过 Checkstyle、SpotBugs、PMD 检查
- [ ] **QA-5** ✅ 无新增的编译警告

### Step 5.3: 性能验收

- [ ] **PERF-1** ✅ 使用Postman测试 refreshToken 响应时间 < 200ms

---

## 阶段6: 提交代码 (预计耗时: 15分钟)

### Step 6.1: Git提交

- [ ] **6.1.1** 查看变更
  ```bash
  git status
  git diff
  ```

- [ ] **6.1.2** 暂存变更
  ```bash
  git add exam-application/src/main/java/com/duanruo/exam/application/service/JwtTokenService.java
  git add exam-application/src/main/java/com/duanruo/exam/application/service/AuthenticationService.java
  git add exam-application/src/test/java/com/duanruo/exam/application/service/
  git add docs/architecture/token-generation-optimization-plan.md
  git add docs/architecture/token-optimization-implementation-checklist.md
  git add CLAUDE.md
  ```

- [ ] **6.1.3** 提交变更
  ```bash
  git commit -m "refactor(auth): optimize JWT token generation mechanism

  ## Changes
  - Refactor JwtTokenService to eliminate code duplication
  - Rename generateToken() to generateGlobalToken() for clarity
  - Add tokenType field to JWT claims (GLOBAL/TENANT)
  - Fix refreshToken() to preserve tenant context (P0 bug fix)
  - Add comprehensive unit tests for token refresh scenarios

  ## Breaking Changes
  None - fully backward compatible

  ## Related Issues
  - Fixes tenant context loss during token refresh
  - Improves code maintainability

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```

- [ ] **6.1.4** 推送到远程(如果需要)
  ```bash
  git push origin <branch-name>
  ```

---

## 完成确认

- [ ] **所有检查项已完成**
- [ ] **所有测试通过**
- [ ] **代码已提交**
- [ ] **相关人员已通知**

**完成时间**: ________________
**执行人签名**: ________________

---

## 回滚指南 (如果需要)

如果发现重大问题,按以下步骤回滚:

1. **立即回滚代码**
   ```bash
   git revert HEAD
   git push origin <branch-name>
   ```

2. **重启服务**
   ```bash
   ./scripts/start-backend.ps1
   ```

3. **验证回滚成功**
   - 测试 `/auth/login`
   - 测试 `/auth/refresh`

4. **分析问题原因**
   - 查看日志
   - 收集错误信息
   - 更新设计方案

5. **重新计划实施**
