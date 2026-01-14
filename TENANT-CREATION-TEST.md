# 租户创建功能测试指南

## 🎯 测试目标

验证修复后的租户创建功能能够自动:
1. 创建租户记录到 `public.tenants` 表
2. 创建独立的物理 schema `tenant_{code}`
3. 在新 schema 中创建所有18张业务表
4. 验证表结构和索引

---

## 📋 前置条件

### 1. 数据库配置

确保 PostgreSQL 数据库已启动,并配置正确:

```bash
# 检查环境变量
DATABASE_URL="postgresql://user:password@localhost:5432/exam_registration"
```

### 2. 依赖安装

```bash
cd server
npm install
```

### 3. 编译 TypeScript

```bash
npm run build
```

---

## 🧪 测试步骤

### 步骤1: 启动服务器

```bash
cd server
npm run start:dev
```

等待服务启动,看到日志:
```
[Nest] INFO  [NestApplication] Nest application successfully started
```

### 步骤2: 创建超级管理员(如果不存在)

首先需要有一个 SUPER_ADMIN 用户来创建租户。

**方式1: 通过注册接口**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "email": "superadmin@example.com",
    "password": "Admin@123456",
    "fullName": "Super Admin"
  }'
```

**方式2: 直接在数据库中创建**
```sql
-- 使用 bcrypt 哈希密码 (Admin@123456)
INSERT INTO users (id, username, email, password_hash, full_name, status, roles)
VALUES (
  gen_random_uuid(),
  'superadmin',
  'superadmin@example.com',
  '$2b$10$YourBcryptHashHere',
  'Super Admin',
  'ACTIVE',
  '["SUPER_ADMIN"]'
);
```

### 步骤3: 登录获取 Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "Admin@123456"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "superadmin",
      "roles": ["SUPER_ADMIN"]
    }
  }
}
```

保存 `token` 用于后续请求。

### 步骤4: 创建测试租户

```bash
export TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/v1/super-admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "测试公司A",
    "code": "test_company_a",
    "contactEmail": "admin@test-company-a.com"
  }'
```

**预期响应** (成功):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "测试公司A",
    "code": "test_company_a",
    "schemaName": "tenant_test_company_a",
    "status": "ACTIVE",
    "contactEmail": "admin@test-company-a.com",
    "createdAt": "2025-01-06T10:30:00.000Z"
  }
}
```

**查看服务器日志** (应该看到):
```
[TenantService] LOG Initializing schema: tenant_test_company_a
[TenantService] LOG Successfully initialized schema: tenant_test_company_a with 85 statements
[TenantService] DEBUG All 8 critical tables verified in tenant_test_company_a
[TenantService] LOG Schema verification passed: tenant_test_company_a
```

---

## ✅ 验证结果

### 验证1: 检查租户记录

```sql
SELECT id, name, code, schema_name, status, created_at
FROM tenants
WHERE code = 'test_company_a';
```

**预期结果**:
```
 id   | name      | code            | schema_name             | status | created_at
------+-----------+-----------------+-------------------------+--------+-------------------------
 uuid | 测试公司A | test_company_a  | tenant_test_company_a   | ACTIVE | 2025-01-06 10:30:00
```

### 验证2: 检查 Schema 是否创建

```sql
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'tenant_test_company_a';
```

**预期结果**:
```
 schema_name
-------------------------
 tenant_test_company_a
```

### 验证3: 检查租户表是否创建

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'tenant_test_company_a'
ORDER BY table_name;
```

**预期结果** (应该看到18张表):
```
 table_name
---------------------------
 allocation_batches
 application_audit_logs
 applications
 exam_admins
 exam_reviewers
 exam_scores
 exams
 files
 payment_orders
 positions
 review_tasks
 reviews
 rooms
 seat_assignments
 subjects
 ticket_number_rules
 ticket_sequences
 tickets
 venues
```

### 验证4: 检查 MinIO Bucket 创建

```bash
# 使用 MinIO Client (mc) 检查 bucket
mc ls minio/tenant-test-company-a-files

# 或使用 MinIO Console
# 访问 http://localhost:9001
# 登录后查看 Buckets 列表
```

**预期结果**:
- 应该看到 `tenant-test-company-a-files` bucket 存在
- Bucket 为空(刚创建)

**检查 bucket 详情**:
```bash
# 查看 bucket 信息
mc stat minio/tenant-test-company-a-files

# 查看 bucket 配额(如果设置)
mc quota info minio/tenant-test-company-a-files
```

### 验证5: 检查表结构示例

```sql
-- 切换到租户 schema
SET search_path TO tenant_test_company_a, public;

-- 查看 exams 表结构
\d exams

-- 查看索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'tenant_test_company_a'
AND tablename = 'applications'
ORDER BY indexname;
```

**预期结果**:
- `exams` 表应该有所有字段(id, code, title, description, etc.)
- `applications` 表应该有索引:
  - `idx_applications_exam_id`
  - `idx_applications_candidate_id`
  - `idx_applications_position_id`
  - `uk_applications_exam_candidate` (unique)

### 验证6: 测试数据隔离 (数据库 + 存储)

创建第二个租户:

```bash
curl -X POST http://localhost:3000/api/v1/super-admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "测试公司B",
    "code": "test_company_b",
    "contactEmail": "admin@test-company-b.com"
  }'
```

验证两个租户的数据隔离:

#### 数据库隔离验证

```sql
-- 在租户A创建测试数据
SET search_path TO tenant_test_company_a, public;
INSERT INTO exams (id, code, title, status)
VALUES (gen_random_uuid(), 'EXAM001', '租户A考试1', 'DRAFT');

-- 在租户B创建测试数据
SET search_path TO tenant_test_company_b, public;
INSERT INTO exams (id, code, title, status)
VALUES (gen_random_uuid(), 'EXAM001', '租户B考试1', 'DRAFT');

-- 验证隔离: 租户A看不到租户B的数据
SET search_path TO tenant_test_company_a, public;
SELECT code, title FROM exams;  -- 只看到 "租户A考试1"

SET search_path TO tenant_test_company_b, public;
SELECT code, title FROM exams;  -- 只看到 "租户B考试1"
```

#### 对象存储隔离验证

```bash
# 在租户A的bucket上传文件
echo "租户A的文件" > tenant-a-file.txt
mc cp tenant-a-file.txt minio/tenant-test-company-a-files/uploads/test/

# 在租户B的bucket上传文件
echo "租户B的文件" > tenant-b-file.txt
mc cp tenant-b-file.txt minio/tenant-test-company-b-files/uploads/test/

# 验证隔离: 租户A只能看到自己的文件
mc ls minio/tenant-test-company-a-files/uploads/test/
# 输出: tenant-a-file.txt

mc ls minio/tenant-test-company-b-files/uploads/test/
# 输出: tenant-b-file.txt

# 租户A无法访问租户B的bucket (权限拒绝)
mc cp minio/tenant-test-company-b-files/uploads/test/tenant-b-file.txt /tmp/
# 应该报错: Access Denied
```

**预期结果**:
- ✅ 数据库层面: 租户数据完全隔离
- ✅ 存储层面: 每个租户独立 bucket
- ✅ 访问控制: 无法跨租户访问文件

---

## ❌ 故障排查

### 错误1: 租户创建失败

**错误信息**:
```
Failed to initialize schema tenant_xxx: SQL template file not found
```

**原因**: SQL 模板文件路径不正确

**解决**:
1. 确认文件存在: `server/src/tenant/tenant-schema-template.sql`
2. 检查编译输出: `server/dist/tenant/tenant-schema-template.sql`
3. 如果文件不在 dist 目录,修改 `nest-cli.json`:

```json
{
  "compilerOptions": {
    "assets": [
      "**/*.sql"
    ]
  }
}
```

然后重新编译: `npm run build`

### 错误2: 表创建失败

**错误信息**:
```
Critical table 'exams' not found in schema 'tenant_xxx'
```

**原因**: SQL 语句执行失败

**排查步骤**:

1. **查看数据库日志**:
```bash
# PostgreSQL 日志位置 (根据配置调整)
tail -f /var/log/postgresql/postgresql-14-main.log
```

2. **手动执行 SQL 模板**:
```bash
psql -U username -d exam_registration < server/src/tenant/tenant-schema-template.sql
```

3. **检查数据库权限**:
```sql
-- 检查用户权限
SELECT * FROM information_schema.role_table_grants
WHERE grantee = 'your_db_user';
```

### 错误3: 事务回滚

**错误信息**:
```
Transaction failed: Cannot create schema
```

**可能原因**:
- Schema 名称不合法
- 数据库连接中断
- 权限不足

**解决**:
1. 检查 `code` 参数只包含小写字母、数字、下划线
2. 确认数据库连接稳定
3. 确认数据库用户有 `CREATE` 权限

### 错误4: MinIO Bucket 创建失败

**错误信息**:
```
Failed to create storage bucket for tenant: Connection refused
```

**可能原因**:
- MinIO 服务未启动
- MinIO 连接配置错误
- Bucket 命名不符合规范

**排查步骤**:

1. **检查 MinIO 服务状态**:
```bash
# 检查 MinIO 是否运行
docker ps | grep minio

# 或
curl http://localhost:9000/minio/health/live
```

2. **检查环境变量配置**:
```bash
# 检查 .env 文件
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
```

3. **测试 MinIO 连接**:
```bash
# 使用 mc 测试连接
mc alias set local http://localhost:9000 minioadmin minioadmin
mc ls local/
```

4. **检查 Bucket 命名**:
```typescript
// Bucket 名称规则:
// - 3-63 字符
// - 小写字母、数字、连字符
// - 不能使用下划线

// ❌ 错误示例
tenant_company_a_files  // 包含下划线

// ✅ 正确示例
tenant-company-a-files  // 使用连字符
```

**解决**:
- 启动 MinIO 服务
- 修正环境变量配置
- 确保租户 code 符合命名规范

**注意**: 如果 Bucket 创建失败,租户创建仍会成功(只记录错误),可以后续手动创建 bucket:

```bash
mc mb minio/tenant-{code}-files
```

---

## 🔍 性能测试

### 测量租户创建耗时

```bash
time curl -X POST http://localhost:3000/api/v1/super-admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "性能测试公司", "code": "perf_test", "contactEmail": "test@example.com"}'
```

**预期耗时**: 500ms - 1500ms

### 批量创建测试

创建10个租户,测试并发创建能力:

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/v1/super-admin/tenants \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\": \"测试公司${i}\", \"code\": \"test_company_${i}\", \"contactEmail\": \"admin${i}@example.com\"}" &
done
wait
```

检查是否全部创建成功:

```sql
SELECT code, schema_name, status
FROM tenants
WHERE code LIKE 'test_company_%'
ORDER BY code;
```

---

## 📊 测试报告模板

### 测试环境

- **操作系统**: Windows 11 / Ubuntu 22.04
- **Node.js 版本**: v20.x
- **PostgreSQL 版本**: 14.x
- **数据库配置**:
  - CPU: 4 cores
  - Memory: 8GB
  - Disk: SSD

### 测试结果

| 测试项 | 预期结果 | 实际结果 | 状态 |
|-------|---------|---------|------|
| **数据库层** |
| 创建租户记录 | ✅ | ✅ | PASS |
| 创建物理 schema | ✅ | ✅ | PASS |
| 创建18张业务表 | ✅ | ✅ | PASS |
| 创建索引和约束 | ✅ | ✅ | PASS |
| 验证表存在 | ✅ | ✅ | PASS |
| 数据库数据隔离 | ✅ | ✅ | PASS |
| **存储层** |
| 创建 MinIO bucket | ✅ | ✅ | PASS |
| Bucket 命名正确 | ✅ | ✅ | PASS |
| 存储数据隔离 | ✅ | ✅ | PASS |
| 文件上传测试 | ✅ | ✅ | PASS |
| 文件下载测试 | ✅ | ✅ | PASS |
| **性能测试** |
| 平均创建耗时 | <1.5s | 900ms | PASS |
| 并发创建10个租户 | ✅ | ✅ | PASS |

### 问题记录

| 序号 | 问题描述 | 严重程度 | 状态 | 解决方案 |
|-----|---------|---------|------|---------|
| 1 | - | - | - | - |

---

## ✨ 后续优化建议

1. **异步初始化**: 对于大量表的 schema,考虑异步初始化以提升响应速度
2. **模板缓存**: 缓存 SQL 模板内容,避免每次读取文件
3. **批量创建优化**: 使用连接池优化并发创建性能
4. **监控告警**: 添加租户创建失败的告警机制

---

## 📞 支持

如有问题,请联系:
- **技术负责人**: [你的名字]
- **问题追踪**: [Issue Tracker URL]
