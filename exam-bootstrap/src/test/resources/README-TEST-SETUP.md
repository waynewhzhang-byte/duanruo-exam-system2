# 集成测试环境设置指南

## 快速开始

### 步骤1: 创建测试数据库

使用psql命令行工具创建测试数据库：

```powershell
# Windows PowerShell
psql -U postgres -h localhost -p 5432 -f exam-bootstrap/src/test/resources/create-test-database.sql
```

或者手动执行SQL：

```sql
-- 连接到PostgreSQL
psql -U postgres -h localhost -p 5432

-- 创建测试数据库
DROP DATABASE IF EXISTS exam_test;
CREATE DATABASE exam_test
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8';

-- 连接到测试数据库
\c exam_test

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 验证
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');
```

### 步骤2: 验证数据库连接

确保application-test.yml中的数据库配置正确：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/exam_test
    username: postgres
    password: <your-password>  # 修改为您的PostgreSQL密码
```

### 步骤3: 运行集成测试

```bash
# 编译测试代码
mvn clean compile test-compile -pl exam-bootstrap -DskipTests

# 运行集成测试
mvn test -Dtest=ExamManagementIntegrationTest -pl exam-bootstrap
```

---

## 测试数据说明

### 自动创建的数据

集成测试会自动创建以下数据：

1. **Public Schema数据**（由Flyway迁移创建）
   - tenants表（租户表）
   - users表（用户表）
   - 其他公共表

2. **租户Schema数据**（由TestTenantHelper创建）
   - 测试租户：tenant_test_company
   - 业务表：exams, positions, subjects, applications等

3. **测试用户**（由TestAuthHelper创建）
   - 租户管理员用户（TENANT_ADMIN角色）
   - 考生用户（CANDIDATE角色）

### 测试用户权限

测试中会创建具有不同权限的用户：

| 角色 | 权限 | 用途 |
|------|------|------|
| TENANT_ADMIN | 租户管理员权限 | 创建考试、管理岗位、审核报名 |
| CANDIDATE | 考生权限 | 报名考试、查看成绩 |
| PRIMARY_REVIEWER | 一级审核员 | 审核报名材料 |
| SECONDARY_REVIEWER | 二级审核员 | 复核报名材料 |

---

## 测试数据生命周期

### 测试启动时

```
1. Spring Boot启动
   ↓
2. Flyway执行public schema迁移
   → 创建tenants、users等表
   ↓
3. Hibernate验证Entity与表结构一致
   ↓
4. 测试环境就绪
```

### 测试执行时

```
1. @BeforeEach - 测试方法开始
   ↓
2. TestTenantHelper创建租户Schema
   → 在public.tenants插入记录
   → 创建tenant_test_company Schema
   → 执行租户迁移脚本（db/tenant-migration/）
   ↓
3. TestAuthHelper创建测试用户
   → 注册租户管理员
   → 注册考生用户
   ↓
4. TestDataFactory创建测试数据
   → 创建考试
   → 创建岗位
   → 创建科目
   ↓
5. 执行测试逻辑
   ↓
6. @Transactional自动回滚
   → public schema数据回滚
   → 租户Schema被清理
```

### 测试结束时

```
1. 所有测试完成
   ↓
2. Spring Boot关闭
   ↓
3. 数据库连接关闭
```

---

## 常见问题

### Q1: 测试失败 - 数据库连接错误

**错误信息**:
```
connection to server at "localhost", port 5432 failed
```

**解决方案**:
1. 检查PostgreSQL服务是否运行
2. 检查端口是否正确（默认5432）
3. 检查用户名和密码是否正确

### Q2: 测试失败 - 数据库不存在

**错误信息**:
```
database "exam_test" does not exist
```

**解决方案**:
执行步骤1创建测试数据库

### Q3: 测试失败 - Flyway迁移错误

**错误信息**:
```
Flyway migration failed
```

**解决方案**:
1. 删除测试数据库重新创建
2. 检查Flyway迁移脚本是否有语法错误

```sql
DROP DATABASE IF EXISTS exam_test;
-- 然后重新执行步骤1
```

### Q4: 测试失败 - 权限不足

**错误信息**:
```
Access Denied
```

**解决方案**:
检查测试用户是否正确创建并分配了角色

### Q5: 如何清理测试数据？

测试数据会自动清理（@Transactional回滚），但如果需要手动清理：

```sql
-- 连接到测试数据库
psql -U postgres -d exam_test

-- 查看所有Schema
\dn

-- 删除租户Schema
DROP SCHEMA IF EXISTS tenant_test_company CASCADE;

-- 清理public schema数据
TRUNCATE TABLE tenants CASCADE;
TRUNCATE TABLE users CASCADE;
```

---

## 测试覆盖

### ExamManagementIntegrationTest

测试场景：
1. ✅ 创建考试成功
2. ✅ 创建考试并添加岗位和科目
3. ✅ 查询考试详情
4. ✅ 更新考试信息
5. ✅ 发布考试
6. ✅ 未认证访问拒绝
7. ✅ 权限不足访问拒绝

---

## 下一步

完成ExamManagementIntegrationTest后，继续实现：

1. ApplicationWorkflowIntegrationTest（报名流程）
2. PaymentWorkflowIntegrationTest（支付流程）
3. SeatingAllocationIntegrationTest（座位分配）
4. TicketManagementIntegrationTest（准考证管理）
5. RepositoryIntegrationTest（仓储层测试）

---

**文档版本**: 1.0  
**最后更新**: 2025-10-22

