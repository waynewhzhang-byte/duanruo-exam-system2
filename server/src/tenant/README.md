# Tenant Schema Management

## 概述

本模块实现了多租户 SaaS 系统的自动化租户创建和 schema 初始化功能。

## 核心功能

### 1. 自动化租户创建

当创建新租户时,系统会自动执行以下操作:

```
1. 在 public.tenants 表中创建租户记录
2. 创建独立的物理 schema: tenant_{code}
3. 在新 schema 中创建所有业务表(18张表)
4. 验证关键表是否成功创建
```

### 2. Schema 隔离设计

| 数据类型 | Schema | 说明 |
|---------|--------|------|
| 平台数据 | `public` | users, tenants, user_tenant_roles |
| 租户数据 | `tenant_{code}` | exams, applications, reviews, etc. |

### 3. 租户级表结构

每个租户 schema 包含以下表:

#### 核心业务表
- `exams` - 考试信息
- `positions` - 岗位信息
- `subjects` - 考试科目
- `applications` - 报名申请

#### 审核流程表
- `review_tasks` - 审核任务
- `reviews` - 审核记录
- `exam_reviewers` - 审核员配置
- `application_audit_logs` - 审计日志

#### 支付与票务
- `payment_orders` - 支付订单
- `tickets` - 准考证
- `ticket_number_rules` - 准考证号规则
- `ticket_sequences` - 准考证序列

#### 考场管理
- `venues` - 考场
- `rooms` - 考场房间
- `seat_assignments` - 座位分配
- `allocation_batches` - 分配批次

#### 其他
- `files` - 文件记录
- `exam_scores` - 考试成绩
- `exam_admins` - 考试管理员

## 使用方法

### 创建租户

通过 API 创建租户:

```bash
POST /api/v1/super-admin/tenants
Content-Type: application/json

{
  "name": "测试公司A",
  "code": "test_company_a",
  "contactEmail": "admin@company-a.com"
}
```

系统会自动:
- 创建租户记录
- 创建 schema: `tenant_test_company_a`
- 初始化所有18张业务表
- 验证表创建成功

### Schema 初始化流程

```typescript
// TenantService 内部流程
async createTenant(data) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. 创建租户记录
    const tenant = await tx.tenant.create({ ... });

    // 2. 创建物理 schema
    await tx.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "tenant_xxx"`);

    // 3. 自动初始化表结构
    await this.initializeTenantSchema(tx, schemaName);
    //    ↓
    //    - 读取 tenant-schema-template.sql
    //    - 执行 DDL 语句
    //    - 验证关键表存在

    return tenant;
  });
}
```

## 文件说明

### `tenant.service.ts`

核心服务类,包含:

- `createTenant()` - 租户创建主流程
- `initializeTenantSchema()` - Schema 初始化(自动执行 SQL 模板)
- `verifySchemaInitialization()` - 验证表创建成功

### `tenant-schema-template.sql`

SQL 模板文件,定义了所有租户级表的结构:

- 18张业务表的 DDL
- 所有索引和外键约束
- 符合 Prisma schema 定义

**重要**: 当 Prisma schema 发生变更时,需要同步更新此文件!

## 验证

### 1. 检查 Schema 是否创建

```sql
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name LIKE 'tenant_%';
```

### 2. 检查表是否创建

```sql
SET search_path TO tenant_test_company_a, public;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'tenant_test_company_a';
```

应该看到 18 张表:
- exams, positions, subjects, applications
- review_tasks, reviews, exam_reviewers
- payment_orders, tickets, ticket_number_rules, ticket_sequences
- venues, rooms, seat_assignments, allocation_batches
- files, application_audit_logs, exam_scores, exam_admins

### 3. 测试数据隔离

```sql
-- 切换到租户 A
SET search_path TO tenant_test_company_a, public;
SELECT * FROM exams;

-- 切换到租户 B
SET search_path TO tenant_test_company_b, public;
SELECT * FROM exams;  -- 应该看到不同的数据
```

## 错误处理

### 常见错误

#### 1. SQL 模板文件未找到

```
Error: SQL template file not found at: /path/to/tenant-schema-template.sql
```

**解决**: 确保 `tenant-schema-template.sql` 文件存在于 `src/tenant/` 目录中

#### 2. 表创建失败

```
Error: Critical table 'exams' not found in schema 'tenant_xxx'
```

**解决**:
- 检查 PostgreSQL 用户权限
- 检查 SQL 模板语法
- 查看数据库日志

#### 3. Schema 已存在

```
Error: schema "tenant_xxx" already exists
```

**解决**: 系统使用 `CREATE SCHEMA IF NOT EXISTS`,正常情况不会报错。如果报错,检查数据库状态。

## 事务保证

租户创建使用 Prisma 事务,确保原子性:

```typescript
await this.prisma.$transaction(async (tx) => {
  // 所有操作在同一个事务中
  // 任何步骤失败,整个事务回滚
});
```

**保证**:
- 要么全部成功(租户记录 + schema + 所有表)
- 要么全部失败(不会留下半成品)

## 性能考虑

### Schema 创建时间

- 创建空 schema: ~10ms
- 创建18张表 + 索引: ~200-500ms
- 总耗时: 约 0.5-1 秒

### 优化建议

1. **批量创建**: 使用单个大的 SQL 语句而非多个小语句
2. **索引**: 在业务运行后再创建非关键索引
3. **并行**: 多个租户创建可以并行执行

## 维护指南

### 当 Prisma Schema 变更时

1. **修改 `prisma/schema.prisma`**
   - 添加/修改租户级 model

2. **生成迁移**
   ```bash
   npm run prisma:migrate:dev
   ```

3. **同步更新 `tenant-schema-template.sql`**
   - 根据新的 model 定义更新 SQL
   - 确保字段类型、约束一致

4. **运行测试**
   ```bash
   npm run test:tenant-creation
   ```

### SQL 模板维护规范

- 使用 `CREATE TABLE IF NOT EXISTS` 防止重复创建
- 所有外键使用 `ON DELETE CASCADE`
- 索引命名: `idx_{table}_{column}`
- 唯一约束命名: `uk_{table}_{columns}`

## 安全注意事项

1. **Schema 命名**: 只允许字母、数字、下划线
2. **SQL 注入防护**: 使用参数化查询
3. **权限控制**: 租户只能访问自己的 schema
4. **审计日志**: 记录所有租户创建操作

## 监控建议

### 关键指标

- 租户创建成功率
- Schema 初始化耗时
- 表创建失败率

### 日志级别

```typescript
this.logger.log()     // 正常流程
this.logger.debug()   // 详细信息
this.logger.error()   // 错误信息
```

## 未来优化

1. **模板 Schema 方式**: 从模板 schema 克隆结构,无需维护 SQL 文件
2. **异步初始化**: 先创建租户记录,后台异步初始化 schema
3. **增量迁移**: 支持对已存在的租户 schema 执行增量迁移

## 相关文档

- [多租户架构设计](../../CLAUDE.md#多租户架构设计)
- [Prisma Schema 文档](../../prisma/schema.prisma)
- [API 文档 - 租户管理](../../docs/api/tenants.md)
