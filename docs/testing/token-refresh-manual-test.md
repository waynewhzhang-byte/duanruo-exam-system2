# Token刷新功能手动测试指南

**测试目的**: 验证优化后的Token生成机制,确保租户Token刷新时保留租户上下文

**前提条件**:
- 后端服务已启动: `http://localhost:8081`
- 数据库已初始化
- 有测试用户和租户数据

**工具**: 使用 Postman、Insomnia、或浏览器开发者工具

---

## 测试准备

### 1. 检查服务状态

```bash
# 访问健康检查端点
GET http://localhost:8081/api/v1/actuator/health
```

**预期响应**:
```json
{
  "status": "UP"
}
```

---

## 测试场景1: 全局Token刷新 (无租户角色用户)

### 1.1 创建超级管理员(如果不存在)

```http
POST http://localhost:8081/api/v1/auth/bootstrap/create-initial-admin
Content-Type: application/json

{
  "username": "super_admin",
  "email": "super@example.com",
  "password": "Admin@123456",
  "passwordConfirmation": "Admin@123456",
  "fullName": "超级管理员"
}
```

### 1.2 登录(获取全局Token)

```http
POST http://localhost:8081/api/v1/auth/login
Content-Type: application/json

{
  "username": "super_admin",
  "password": "Admin@123456"
}
```

**预期响应**:
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": "xxx",
    "username": "super_admin",
    ...
  }
}
```

### 1.3 解码Token验证tokenType

使用 https://jwt.io 解码上面的Token

**预期Payload包含**:
```json
{
  "userId": "xxx",
  "username": "super_admin",
  "tokenType": "GLOBAL",  // ✅ 关键验证点
  "roles": ["SUPER_ADMIN"],
  "permissions": ["USER_MANAGE", "TENANT_MANAGE", ...],
  "status": "ACTIVE",
  ...
}
```

**验证点**:
- ✅ `tokenType` 字段存在且值为 `"GLOBAL"`
- ✅ 不包含 `tenantId` 字段

### 1.4 刷新Token

```http
POST http://localhost:8081/api/v1/auth/refresh
Authorization: Bearer <上面获取的token>
```

**预期响应**:
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",  // 新Token
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {...}
}
```

### 1.5 解码新Token验证

使用 https://jwt.io 解码新Token

**预期结果**:
- ✅ 新Token也包含 `"tokenType": "GLOBAL"`
- ✅ 新Token不包含 `tenantId` 字段
- ✅ `iat`(签发时间) 比旧Token更新
- ✅ 其他Claims内容与旧Token一致

**测试结果**: ✅ 全局Token刷新保持全局上下文

---

## 测试场景2: 租户Token刷新 (有租户角色用户)

### 2.1 创建租户(使用超级管理员Token)

```http
POST http://localhost:8081/api/v1/tenants
Authorization: Bearer <super_admin的token>
Content-Type: application/json

{
  "name": "测试公司A",
  "code": "test_company_a",
  "slug": "test-a",
  "contactEmail": "contact@test-a.com"
}
```

**保存响应中的 `tenantId`**: `<tenant_id>`

### 2.2 创建租户管理员用户

```http
POST http://localhost:8081/api/v1/auth/admin/create-tenant-admin
Authorization: Bearer <super_admin的token>
Content-Type: application/json

{
  "username": "tenant_admin_a",
  "email": "admin@test-a.com",
  "password": "Admin@123456",
  "passwordConfirmation": "Admin@123456",
  "fullName": "租户管理员A"
}
```

### 2.3 为用户分配租户角色

```http
POST http://localhost:8081/api/v1/tenants/<tenant_id>/users/<user_id>/roles
Authorization: Bearer <super_admin的token>
Content-Type: application/json

{
  "role": "TENANT_ADMIN"
}
```

### 2.4 租户管理员登录

```http
POST http://localhost:8081/api/v1/auth/login
Content-Type: application/json

{
  "username": "tenant_admin_a",
  "password": "Admin@123456"
}
```

**预期**: 如果用户有租户角色,应该返回租户Token

### 2.5 解码Token验证

使用 https://jwt.io 解码Token

**预期Payload**:
```json
{
  "userId": "xxx",
  "username": "tenant_admin_a",
  "tokenType": "TENANT",        // ✅ 关键验证点
  "tenantId": "<tenant_id>",    // ✅ 包含租户ID
  "roles": ["TENANT_ADMIN"],    // 或合并后的角色
  "permissions": ["EXAM_CREATE", "EXAM_UPDATE", ...],
  "status": "ACTIVE",
  ...
}
```

**验证点**:
- ✅ `tokenType` 为 `"TENANT"`
- ✅ 包含 `tenantId` 字段
- ✅ 角色列表包含租户角色

### 2.6 刷新租户Token (核心测试)

```http
POST http://localhost:8081/api/v1/auth/refresh
Authorization: Bearer <上面的租户token>
```

**预期响应**:
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",  // 新租户Token
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {...}
}
```

### 2.7 解码新Token验证 (关键验证)

使用 https://jwt.io 解码新Token

**预期结果** (修复后的行为):
- ✅ 新Token包含 `"tokenType": "TENANT"`
- ✅ 新Token包含相同的 `"tenantId": "<tenant_id>"` (保留租户上下文!)
- ✅ 新Token包含相同的租户角色和权限
- ✅ `iat`(签发时间) 更新

**对比修复前的错误行为**:
- ❌ 修复前: 新Token会变成 `"tokenType": "GLOBAL"`,丢失 `tenantId`
- ✅ 修复后: 新Token保持 `"tokenType": "TENANT"`,保留 `tenantId`

**测试结果**: ✅ 租户Token刷新保留租户上下文

---

## 测试场景3: 选择租户后刷新

### 3.1 使用全局Token选择租户

假设 `super_admin` 需要访问特定租户:

```http
POST http://localhost:8081/api/v1/auth/select-tenant
Authorization: Bearer <super_admin的全局token>
Content-Type: application/json

{
  "tenantId": "<tenant_id>"
}
```

**预期响应**:
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",  // 新的租户Token
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {...}
}
```

### 3.2 解码Token验证

**预期Payload**:
```json
{
  "userId": "xxx",
  "username": "super_admin",
  "tokenType": "TENANT",            // ✅ 已切换为租户Token
  "tenantId": "<tenant_id>",        // ✅ 包含选中的租户ID
  "roles": ["SUPER_ADMIN", ...],    // 可能包含合并的角色
  "permissions": [...],
  ...
}
```

### 3.3 刷新切换后的租户Token

```http
POST http://localhost:8081/api/v1/auth/refresh
Authorization: Bearer <选择租户后的token>
```

### 3.4 解码新Token验证

**预期结果**:
- ✅ 新Token仍为 `"tokenType": "TENANT"`
- ✅ 新Token保留相同的 `"tenantId": "<tenant_id>"`
- ✅ 用户无需重新选择租户

**测试结果**: ✅ 选择租户后刷新保留租户上下文

---

## 测试场景4: 边界测试 - 租户权限撤销后刷新

### 4.1 准备: 用户有租户Token

按照场景2获取租户Token

### 4.2 撤销用户的租户角色

```http
DELETE http://localhost:8081/api/v1/tenants/<tenant_id>/users/<user_id>/roles/TENANT_ADMIN
Authorization: Bearer <super_admin的token>
```

### 4.3 尝试刷新已失效的租户Token

```http
POST http://localhost:8081/api/v1/auth/refresh
Authorization: Bearer <被撤销权限用户的token>
```

**预期响应**:
```json
{
  "error": "您已失去该租户的访问权限,请重新登录",
  "status": 403
}
```

**验证点**:
- ✅ 返回403错误
- ✅ 错误消息提示权限已失效
- ✅ 系统阻止生成新Token

**测试结果**: ✅ 租户权限撤销后正确拒绝刷新

---

## 测试场景5: 检查服务器日志

### 5.1 查看后端日志

在后端控制台或日志文件中搜索关键词:

**全局Token刷新日志**:
```
Refreshing global token for user super_admin
```

**租户Token刷新日志**:
```
Refreshing tenant token for user tenant_admin_a in tenant <tenant_id>
Refreshed tenant token for user tenant_admin_a in tenant <tenant_id>, roles: [TENANT_ADMIN]
```

**验证点**:
- ✅ 日志清晰区分全局Token和租户Token刷新
- ✅ 租户Token刷新时记录租户ID和角色信息

---

## 完整测试检查清单

### 功能验收

- [ ] **FR-1**: 用户使用租户Token刷新时,返回的新Token包含相同的tenantId
- [ ] **FR-2**: 用户使用全局Token刷新时,返回的新Token不包含tenantId
- [ ] **FR-3**: 当用户的租户权限被撤销后,刷新租户Token会返回403错误
- [ ] **FR-4**: 所有Token都包含 `tokenType` 字段("GLOBAL" 或 "TENANT")
- [ ] **FR-5**: 前端无需任何修改即可继续工作

### 性能验收

- [ ] **PERF-1**: refreshToken 响应时间 < 200ms (使用Postman查看Duration)

### 日志验证

- [ ] **LOG-1**: 全局Token刷新时有 "Refreshing global token" 日志
- [ ] **LOG-2**: 租户Token刷新时有 "Refreshing tenant token" 和 "Refreshed tenant token" 日志
- [ ] **LOG-3**: 权限撤销拒绝刷新时有错误日志

---

## 问题排查

### 问题1: Token刷新返回400错误

**可能原因**: Token已过期或格式错误

**解决**: 重新登录获取新Token

### 问题2: 租户Token刷新后仍变成全局Token

**可能原因**: 代码未正确部署或数据库中用户租户角色缺失

**检查**:
1. 确认后端服务已重新启动
2. 查询数据库: `SELECT * FROM public.user_tenant_roles WHERE user_id = '<user_id>';`
3. 查看服务器日志是否有 "Refreshing tenant token" 日志

### 问题3: refreshToken响应慢 (>500ms)

**可能原因**: 数据库查询未优化

**检查**:
1. 查看日志中的SQL执行时间
2. 确认 `user_tenant_roles` 表有正确的索引

---

## 自动化测试脚本 (可选)

如果需要自动化测试,可以使用以下Postman Collection:

```json
{
  "info": {
    "name": "Token Refresh Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Scenario 1: Global Token Refresh",
      "item": [
        {"name": "1. Login as super_admin", "request": {...}},
        {"name": "2. Refresh global token", "request": {...}},
        {"name": "3. Verify tokenType=GLOBAL", "event": [...]}
      ]
    },
    {
      "name": "Scenario 2: Tenant Token Refresh",
      "item": [
        {"name": "1. Login as tenant_admin", "request": {...}},
        {"name": "2. Refresh tenant token", "request": {...}},
        {"name": "3. Verify tokenType=TENANT and tenantId preserved", "event": [...]}
      ]
    }
  ]
}
```

---

## 测试完成确认

测试完成后,请确认以下内容:

- [ ] 所有5个测试场景均已执行
- [ ] 所有功能验收标准通过
- [ ] 性能验收标准达标
- [ ] 服务器日志正常
- [ ] 未发现新的Bug

**测试人**: ________________
**测试日期**: ________________
**测试结果**: ☐ 通过  ☐ 失败 (请注明失败原因)

---

**相关文档**:
- [Token优化设计方案](../architecture/token-generation-optimization-plan.md)
- [实施检查清单](../architecture/token-optimization-implementation-checklist.md)
