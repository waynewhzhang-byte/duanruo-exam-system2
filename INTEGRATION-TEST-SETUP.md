# 集成测试环境设置 - 快速指南

## 📋 前提条件

- ✅ PostgreSQL 15+ 已安装并运行
- ✅ Java 21+ 已安装
- ✅ Maven 3.8+ 已安装

---

## 🚀 快速开始（3步）

### 步骤1: 创建测试数据库

打开PostgreSQL命令行（psql）或使用pgAdmin，执行：

```sql
-- 创建测试数据库
DROP DATABASE IF EXISTS exam_test;
CREATE DATABASE exam_test
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8';

-- 连接到测试数据库
\c exam_test

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 验证扩展已安装
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');
```

**预期输出**:
```
   extname   | extversion 
-------------+------------
 uuid-ossp   | 1.1
 pgcrypto    | 1.3
```

---

### 步骤2: 配置数据库密码

编辑 `exam-bootstrap/src/test/resources/application-test.yml`，修改数据库密码：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/exam_test
    username: postgres
    password: <your-password>  # ← 修改为您的PostgreSQL密码
```

---

### 步骤3: 运行集成测试

在项目根目录执行：

```bash
# 编译测试代码
mvn clean compile test-compile -pl exam-bootstrap -DskipTests

# 运行集成测试
mvn test -Dtest=ExamManagementIntegrationTest -pl exam-bootstrap
```

---

## ✅ 预期结果

### 成功的测试输出

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.duanruo.exam.bootstrap.integration.ExamManagementIntegrationTest

Flyway Community Edition ... by Redgate
Database: jdbc:postgresql://localhost:5432/exam_test (PostgreSQL 15.x)
Successfully validated 19 migrations (execution time 00:00.123s)
Current version of schema "public": 019
Schema "public" is up to date. No migration necessary.

Creating test tenant: 测试公司 (schema: tenant_test_company)
Schema created: tenant_test_company
Flyway migrating schema tenant_test_company to version 001 - Create tenant business tables
Flyway migrating schema tenant_test_company to version 002 - Add performance indexes
Flyway migrating schema tenant_test_company to version 003 - Extend columns for encryption
Flyway migrating schema tenant_test_company to version 004 - Extend tickets encrypted columns
Tenant schema initialized successfully: tenant_test_company

[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 15.234 s
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

### 测试覆盖

✅ **7个测试场景全部通过**:

1. `shouldCreateExamSuccessfully` - 创建考试成功
2. `shouldCreateExamWithPositionsAndSubjects` - 创建考试并添加岗位和科目
3. `shouldGetExamDetails` - 查询考试详情
4. `shouldUpdateExamInformation` - 更新考试信息
5. `shouldPublishExam` - 发布考试
6. `shouldDenyAccessWhenNotAuthenticated` - 未认证访问拒绝
7. `shouldDenyAccessWhenInsufficientPermissions` - 权限不足访问拒绝

---

## 🔍 验证数据库架构

测试运行后，可以验证数据库架构是否正确创建：

```sql
-- 连接到测试数据库
psql -U postgres -d exam_test

-- 查看所有Schema
\dn

-- 预期输出：
--   Name              | Owner    
-- --------------------+----------
--  public             | postgres
--  tenant_test_company| postgres

-- 查看public schema中的表
\dt public.*

-- 预期输出：
--  public | tenants                  | table | postgres
--  public | users                    | table | postgres
--  public | flyway_schema_history    | table | postgres
--  ... (其他公共表)

-- 查看租户schema中的表
\dt tenant_test_company.*

-- 预期输出：
--  tenant_test_company | exams           | table | postgres
--  tenant_test_company | positions       | table | postgres
--  tenant_test_company | subjects        | table | postgres
--  tenant_test_company | applications    | table | postgres
--  tenant_test_company | payment_orders  | table | postgres
--  tenant_test_company | tickets         | table | postgres
--  ... (其他业务表)
```

---

## 🎯 架构验证

### 多租户Schema隔离架构

```
exam_test (数据库)
├── public (Schema)
│   ├── tenants (租户表) ✅
│   ├── users (用户表) ✅
│   ├── flyway_schema_history ✅
│   └── ... (19个Flyway迁移创建的表)
│
└── tenant_test_company (测试租户Schema)
    ├── exams (考试表) ✅
    ├── positions (岗位表) ✅
    ├── subjects (科目表) ✅
    ├── applications (报名表) ✅
    ├── payment_orders (支付订单表) ✅
    ├── tickets (准考证表) ✅
    ├── 性能索引 ✅
    └── ... (4个租户迁移创建的表)
```

**结论**: ✅ 测试环境与生产环境架构完全一致

---

## 🐛 常见问题

### 问题1: 数据库连接失败

**错误**:
```
connection to server at "localhost", port 5432 failed
```

**解决**:
1. 检查PostgreSQL服务是否运行
2. 检查端口是否为5432
3. 检查用户名和密码是否正确

### 问题2: 数据库不存在

**错误**:
```
database "exam_test" does not exist
```

**解决**:
重新执行步骤1创建测试数据库

### 问题3: Flyway迁移失败

**错误**:
```
Flyway migration failed
```

**解决**:
删除测试数据库重新创建：

```sql
DROP DATABASE IF EXISTS exam_test;
-- 然后重新执行步骤1
```

### 问题4: 编译错误

**错误**:
```
[ERROR] Failed to execute goal ... compilation failure
```

**解决**:
```bash
# 清理并重新编译
mvn clean compile test-compile -pl exam-bootstrap
```

---

## 📚 相关文档

- `docs/Integration-Tests-Architecture-Alignment-Report.md` - 架构对齐详细报告
- `docs/Integration-Tests-Setup-Guide.md` - 完整设置指南
- `exam-bootstrap/src/test/resources/README-TEST-SETUP.md` - 测试数据说明
- `exam-bootstrap/src/test/README.md` - 测试快速开始

---

## 📊 测试进度

**Task 4.2 - 后端集成测试**: 20% 完成

- ✅ 测试基础设施（BaseIntegrationTest, TestDataFactory, TestAuthHelper, TestTenantHelper）
- ✅ 架构对齐（Flyway迁移，多租户Schema）
- ✅ ExamManagementIntegrationTest（7个测试场景）
- ⏳ ApplicationWorkflowIntegrationTest（待实现）
- ⏳ PaymentWorkflowIntegrationTest（待实现）
- ⏳ SeatingAllocationIntegrationTest（待实现）
- ⏳ TicketManagementIntegrationTest（待实现）
- ⏳ RepositoryIntegrationTest（待实现）

---

**需要帮助？** 查看详细文档或联系开发团队。

**最后更新**: 2025-10-22

