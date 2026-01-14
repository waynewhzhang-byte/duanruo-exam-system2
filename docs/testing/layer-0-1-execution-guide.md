# 第0-1层BDD测试执行指南

## 📋 快速开始

### 前置条件检查清单

在执行BDD测试前，请确保以下服务已启动：

```bash
# 1. PostgreSQL数据库
# 检查：访问 psql 或数据库管理工具

# 2. 后端服务 (端口 8081)
cd exam-bootstrap
mvn spring-boot:run

# 验证：访问 http://localhost:8081/actuator/health

# 3. 前端服务 (端口 3000)
cd web
npm run dev

# 验证：访问 http://localhost:3000

# 4. MinIO存储服务 (端口 9000) - 可选
# 验证：访问 http://localhost:9000
```

### 执行测试

```bash
# 进入web目录
cd web

# 执行第0层 - 基础设施层（必须首先通过）
npm run test:bdd:layer-0

# 执行第1层 - 租户与用户层
npm run test:bdd:layer-1

# 查看HTML报告
# Windows
start test-results/bdd/layer-0-infrastructure.html
start test-results/bdd/layer-1-tenant-user.html

# Mac/Linux
open test-results/bdd/layer-0-infrastructure.html
open test-results/bdd/layer-1-tenant-user.html
```

## 📂 文件结构总览

```
web/tests/bdd/
├── features/
│   ├── 00-infrastructure/
│   │   └── system-health.feature               ✅ 已完成
│   └── 01-tenant-user/
│       ├── 01-super-admin-login.feature        ✅ 已完成
│       ├── 02-tenant-creation.feature          ✅ 已完成
│       ├── 03-tenant-storage-init.feature      ✅ 已完成
│       ├── 04-tenant-admin-creation.feature    ✅ 已完成
│       ├── 05-tenant-isolation.feature         ✅ 已完成
│       └── 06-candidate-sso.feature            ✅ 已完成
├── step-definitions/
│   ├── layer-0-infrastructure.steps.ts         ✅ 已完成
│   ├── layer-1-tenant-user.steps.ts            ✅ 已完成
│   └── layer-1-additional.steps.ts             ✅ 已完成
├── support/
│   ├── world.ts                                ✅ 现有
│   └── hooks.ts                                ✅ 现有
└── fixtures/
    └── bdd-test-data.ts                        ✅ 现有
```

## 🎯 测试场景详解

### 第0层：基础设施层

**目标**：验证系统基础设施就绪

| 场景 | 验证内容 | 预期结果 |
|------|---------|---------|
| 后端API健康检查 | /actuator/health | HTTP 200, status: UP |
| 数据库连接 | /actuator/health/db | DB status: UP |
| 前端服务 | http://localhost:3000 | 页面正常渲染 |
| MinIO服务 | /minio/health/live | 服务可用 |
| 公共Schema | public schema | tables存在 |
| Flyway迁移 | flyway_schema_history | 迁移已执行 |

### 第1层：租户与用户层

**目标**：验证多租户架构和SSO

#### 1. 超级管理员登录（01-super-admin-login.feature）

**关键场景**：
- ✅ 正确凭据登录成功
- ✅ 错误密码登录失败
- ✅ 验证JWT令牌
- ✅ 验证SUPER_ADMIN角色

**测试数据**：
```typescript
用户名: super_admin
密码: SuperAdmin123!@#
角色: SUPER_ADMIN
```

#### 2. 租户创建（02-tenant-creation.feature）

**关键场景**：
- ✅ 创建新租户
- ✅ 自动创建PostgreSQL Schema
- ✅ 验证Schema表结构
- ✅ Flyway租户迁移执行

**测试数据**：
```typescript
租户名称: BDD测试公司
租户代码: bdd_test_company_{{timestamp}}
联系人: 张三
联系电话: 13800138000
邮箱: contact@bdd-test.com
```

#### 3. 租户存储初始化（03-tenant-storage-init.feature）

**关键场景**：
- ✅ MinIO Bucket自动创建
- ✅ Bucket访问权限设置
- ✅ 路径结构初始化（/attachments, /tickets, /temp）
- ✅ 租户间存储隔离
- ✅ Pre-signed URL生成

#### 4. 租户管理员创建（04-tenant-admin-creation.feature）

**关键场景**：
- ✅ 创建新管理员账号
- ✅ 分配现有用户为管理员
- ✅ user_tenant_roles表关联
- ✅ 管理员登录并选择租户
- ✅ 权限隔离验证

**关键验证点**：
```sql
-- public.users - 全局用户
-- public.user_tenant_roles - 用户-租户-角色关联
-- 用户可以在多个租户拥有不同角色
```

#### 5. 多租户数据隔离（05-tenant-isolation.feature）

**关键场景**：
- ✅ Schema级别隔离
- ✅ API级别租户验证
- ✅ 前端页面X-Tenant-ID传递
- ✅ 文件存储隔离
- ✅ 租户停用数据保留

**隔离机制**：
```
租户A Schema → 只能访问租户A数据
租户B Schema → 只能访问租户B数据
API必须验证 X-Tenant-ID 或 URL中的tenantId
```

#### 6. 考生SSO跨租户（06-candidate-sso.feature）

**关键场景**：
- ✅ 全局账号注册（public.users）
- ✅ 使用同一账号报名租户A考试
- ✅ 使用同一账号报名租户B考试
- ✅ 跨租户报名记录查看
- ✅ JWT不包含tenantId
- ✅ 租户上下文动态切换

**SSO架构**：
```
1个考生账号 (public.users)
  ├─> 租户A: candidates记录 + user_tenant_roles(CANDIDATE)
  └─> 租户B: candidates记录 + user_tenant_roles(CANDIDATE)
```

## 🔧 步骤定义实现总结

### layer-0-infrastructure.steps.ts

**实现的步骤**（15个）：
- HTTP健康检查（axios）
- 响应验证（状态码、内容、时间）
- 数据库健康检查
- 前端页面检查
- MinIO服务检查
- Schema和表验证（通过API）
- Flyway迁移历史查询

### layer-1-tenant-user.steps.ts

**实现的步骤**（25+个）：
- 登录流程（页面导航、表单填写、提交）
- Token验证（JWT解析、角色验证）
- 登录失败场景
- 租户管理页面访问
- 租户创建流程
- 表单填写（智能选择器）
- 成功提示验证

### layer-1-additional.steps.ts

**实现的步骤**（30+个）：
- Schema验证
- MinIO Bucket操作
- 租户隔离API调用
- SSO注册登录
- 跨租户报名流程
- 数据表记录验证

## ⚙️ 关键技术实现

### 1. 智能表单填写（world.ts）

```typescript
// 支持多种选择器策略
await this.fillField('username', 'super_admin');

// 自动尝试：
// - input[id="username"]
// - input[name="username"]
// - input[placeholder*="username"]
// - label[for="username"] + input
// ... 等10+种策略
```

### 2. JWT令牌解析

```typescript
const payload = JSON.parse(
  Buffer.from(token.split('.')[1], 'base64').toString()
);
const roles = payload.roles || payload.authorities || [];
```

### 3. 时间戳占位符

```typescript
// Feature文件
| 租户代码 | bdd_test_company_{{timestamp}} |

// Steps实现
if (actualValue.includes('{{timestamp}}')) {
  const timestamp = Date.now();
  actualValue = actualValue.replace('{{timestamp}}', timestamp.toString());
}
```

### 4. API调用封装

```typescript
const response = await axios.post(`${API_URL}/api/v1/tenants`, data, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': 'tenant_a'
  },
  timeout: 10000
});
```

## 🐛 常见问题和解决方案

### 问题1：找不到页面元素

**症状**：`Error: 找不到字段: username`

**解决方案**：
1. 检查页面是否完全加载
2. 增加waitForTimeout
3. 使用浏览器devtools确认元素选择器
4. 在world.ts的fillField中添加新的选择器策略

### 问题2：登录后获取不到Token

**症状**：`authToken is undefined`

**解决方案**：
```typescript
// 方案1：从Cookie读取
const cookies = await this.context.cookies();
const token = cookies.find(c => c.name === 'auth_token')?.value;

// 方案2：从localStorage读取
const token = await this.page.evaluate(() => localStorage.getItem('token'));

// 方案3：从API响应读取
const response = await axios.post('/api/v1/auth/login', credentials);
const token = response.data.token;
```

### 问题3：租户Schema未创建

**症状**：`Schema tenant_xxx does not exist`

**解决方案**：
1. 检查后端SchemaManagementService实现
2. 验证Flyway租户迁移路径配置
3. 检查数据库权限
4. 查看后端日志确认Schema创建过程

### 问题4：MinIO Bucket验证失败

**症状**：`Bucket verification failed`

**解决方案**：
1. 确认MinIO服务运行
2. 检查MinIO配置（access key, secret key）
3. 验证后端MinIO客户端配置
4. 如果MinIO不可用，步骤会跳过验证

### 问题5：并发测试数据冲突

**症状**：`Duplicate tenant code`

**解决方案**：
```typescript
// 使用唯一时间戳
const timestamp = Date.now();
const tenantCode = `bdd_test_${timestamp}`;

// 或使用UUID
import { v4 as uuidv4 } from 'uuid';
const tenantCode = `bdd_test_${uuidv4().substring(0, 8)}`;
```

## 📊 预期测试结果

### 第0层执行结果
```
Feature: 系统健康检查

  ✓ 验证后端API服务可用性 (1.2s)
  ✓ 验证数据库连接正常 (0.8s)
  ✓ 验证前端服务可用性 (2.1s)
  ✓ 验证MinIO存储服务可用性 (0.5s)
  ✓ 验证公共Schema存在 (0.3s)
  ✓ 验证Flyway迁移历史 (0.4s)

6 scenarios (6 passed)
15 steps (15 passed)
Duration: 5.3s
```

### 第1层执行结果
```
Feature: 超级管理员登录 + 租户管理 + SSO

  01-super-admin-login.feature
  ✓ 超级管理员使用正确凭据登录 (3.5s)
  ✓ 超级管理员使用错误密码登录 (2.1s)
  ✓ 验证超级管理员权限 (1.8s)

  02-tenant-creation.feature
  ✓ 创建新租户 (4.2s)
  ✓ 验证租户Schema初始化 (1.5s)
  ✓ 重复租户代码验证 (1.2s)

  03-tenant-storage-init.feature
  ✓ 租户创建时自动初始化MinIO Bucket (2.8s)
  ✓ 验证租户存储路径结构 (0.9s)
  ✓ 验证租户间存储隔离 (2.3s)

  ... 更多场景

22 scenarios (22 passed)
85 steps (85 passed)
Duration: 45.6s
```

## 🚀 下一步行动

### 立即执行

1. **启动所有服务**
   ```bash
   # Terminal 1: 后端
   cd exam-bootstrap && mvn spring-boot:run

   # Terminal 2: 前端
   cd web && npm run dev
   ```

2. **执行第0层测试**
   ```bash
   cd web
   npm run test:bdd:layer-0
   ```

3. **查看报告并修复问题**
   ```bash
   start test-results/bdd/layer-0-infrastructure.html
   ```

4. **执行第1层测试**
   ```bash
   npm run test:bdd:layer-1
   ```

5. **记录问题和改进**
   - 记录失败的场景
   - 截图保存在 `test-results/bdd/screenshots/`
   - 日志保存在 `test-results/bdd/logs/`

### 迭代优化

1. 修复发现的Bug
2. 优化步骤定义实现
3. 增强错误处理
4. 改进等待策略
5. 完善测试数据管理

### 准备第2层

完成第0-1层验证后，开始第2层（考试配置层）：
- 表单构建器
- 自动审核规则
- 审核员管理
- 考试发布流程

## 📝 测试报告模板

```markdown
# BDD测试执行报告 - 第0-1层

**执行日期**: 2025-11-21
**执行人**: [Your Name]
**环境**: 本地开发环境

## 测试环境
- 后端版本: Java 21 + Spring Boot 3.4.1
- 前端版本: Next.js 14 + React 18
- 数据库: PostgreSQL 15
- MinIO: v8.x

## 执行结果

### 第0层：基础设施层
- 执行场景: 6
- 通过: 6
- 失败: 0
- 跳过: 0
- 耗时: 5.3s

### 第1层：租户与用户层
- 执行场景: 22
- 通过: 20
- 失败: 2
- 跳过: 0
- 耗时: 45.6s

## 失败场景分析

1. **场景**: 验证租户间存储隔离
   - **原因**: MinIO服务未启动
   - **解决**: 启动MinIO或跳过验证

2. **场景**: 考生跨租户报名
   - **原因**: 报名按钮选择器不匹配
   - **解决**: 更新选择器策略

## 改进建议

1. 增强MinIO连接检测
2. 优化页面元素等待策略
3. 增加更多选择器fallback
4. 改进测试数据清理机制

## 附件

- HTML报告: test-results/bdd/layer-1-tenant-user.html
- 失败截图: test-results/bdd/screenshots/
- 控制台日志: test-results/bdd/logs/
```

---

**文档版本**: v1.0
**最后更新**: 2025-11-21
**维护者**: BDD测试团队