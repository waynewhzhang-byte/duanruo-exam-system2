# PostgreSQL Schema 与业务表的区别

## 1. 基本概念

### Schema（模式/命名空间）
- **定义**: Schema 是 PostgreSQL 中的**逻辑容器**，用于组织和隔离数据库对象
- **作用**: 提供命名空间，避免对象名称冲突
- **类比**: 类似于文件系统中的"文件夹"
- **特点**: 
  - 本身不存储数据
  - 只是一个组织单位
  - 可以包含表、视图、函数、序列等对象

### 业务表（Table）
- **定义**: 表是实际**存储数据的结构**
- **作用**: 存储业务数据（行和列）
- **类比**: 类似于文件系统中的"文件"
- **特点**:
  - 实际存储数据
  - 有列定义、约束、索引等
  - 必须属于某个 schema

## 2. 关系

```
数据库 (duanruo-exam-system)
├── public schema (全局共享)
│   ├── users 表
│   ├── tenants 表
│   └── user_tenant_roles 表
│
├── tenant_test_company_a schema (租户A的命名空间)
│   ├── exams 表
│   ├── applications 表
│   ├── reviews 表
│   └── ... (其他业务表)
│
└── tenant_test_company_b schema (租户B的命名空间)
    ├── exams 表
    ├── applications 表
    ├── reviews 表
    └── ... (其他业务表)
```

## 3. 在多租户架构中的区别

### Schema 创建
```sql
-- 创建Schema（空容器）
CREATE SCHEMA tenant_test_company_a;
```

**特点**:
- ✅ 只创建一个空的命名空间
- ✅ 不包含任何表或数据
- ✅ 用于隔离不同租户的对象
- ✅ 每个租户有独立的 schema

### 业务表创建
```sql
-- 在Schema中创建表
CREATE TABLE tenant_test_company_a.exams (
    id UUID PRIMARY KEY,
    exam_name VARCHAR(200),
    ...
);
```

**特点**:
- ✅ 实际的数据存储结构
- ✅ 包含列定义、约束、索引
- ✅ 每个租户的 schema 中都有相同的表结构
- ✅ 但数据完全隔离

## 4. 在代码中的体现

### Schema 创建（直接SQL）
```java
// SchemaManagementService.java 第44-45行
String createSchemaSql = String.format("CREATE SCHEMA IF NOT EXISTS %s", quotedSchemaName);
jdbcTemplate.execute(createSchemaSql);
```

**为什么用SQL？**
- Schema 是数据库的基础结构
- 创建简单，不需要版本管理
- 每个租户只需要创建一次

### 业务表创建（Flyway迁移）
```java
// SchemaManagementService.java 第78-87行
Flyway flyway = Flyway.configure()
    .dataSource(dataSource)
    .schemas(schemaName)
    .locations("classpath:db/tenant-migration")  // 迁移脚本目录
    .load();

flyway.migrate();  // 执行所有迁移脚本
```

**为什么用Flyway？**
- 表结构会随着业务发展而变化
- 需要版本管理和迁移历史
- 可以追踪表结构的变更历史
- 支持回滚和升级

## 5. 实际例子

### 场景：创建新租户 "测试企业C"

#### 步骤1: 创建Schema（空容器）
```sql
CREATE SCHEMA tenant_test_company_c;
```
**结果**: 
- ✅ 创建了一个名为 `tenant_test_company_c` 的空容器
- ❌ 里面没有任何表，没有任何数据

#### 步骤2: 创建业务表（通过Flyway）
执行 `db/tenant-migration/` 目录下的所有迁移脚本：
- `V001__Create_tenant_business_tables.sql` → 创建 exams, applications 等表
- `V002__Add_performance_indexes.sql` → 添加索引
- `V003__...` → 其他迁移脚本

**结果**:
- ✅ 在 `tenant_test_company_c` schema 中创建了所有业务表
- ✅ 表结构与 `tenant_test_company_a` 中的表结构相同
- ❌ 但数据完全独立（空表）

#### 步骤3: 添加外键约束（直接SQL）
```sql
ALTER TABLE tenant_test_company_c.exam_reviewers
ADD CONSTRAINT fk_exam_reviewers_reviewer
FOREIGN KEY (reviewer_id) REFERENCES public.users(id);
```

**结果**:
- ✅ 为表添加了跨schema外键约束
- ✅ 确保数据完整性

## 6. 关键区别总结

| 特性 | Schema | 业务表 |
|------|--------|--------|
| **本质** | 逻辑容器/命名空间 | 数据存储结构 |
| **是否存储数据** | ❌ 否 | ✅ 是 |
| **创建方式** | 直接SQL | Flyway迁移脚本 |
| **版本管理** | 不需要 | ✅ 需要 |
| **变更频率** | 很少（创建租户时） | 经常（业务发展） |
| **隔离级别** | 租户级别 | 租户级别（通过schema隔离） |
| **数量** | 每个租户1个 | 每个租户多张表 |

## 7. 类比理解

### 文件系统类比
```
数据库 = 整个硬盘
Schema = 文件夹（如：D:\租户A\、D:\租户B\）
业务表 = 文件夹中的文件（如：exams.xlsx、applications.xlsx）
```

### 编程语言类比
```
Schema = 命名空间（namespace）
业务表 = 类（class）
数据行 = 对象实例（object instance）
```

## 8. 在多租户架构中的重要性

### Schema 的作用
1. **物理隔离**: 每个租户的数据存储在不同的schema中
2. **命名空间**: 避免表名冲突（多个租户可以有同名的表）
3. **权限控制**: 可以基于schema设置访问权限
4. **备份恢复**: 可以按schema进行备份和恢复

### 业务表的作用
1. **数据存储**: 实际存储业务数据
2. **数据结构**: 定义数据的组织方式
3. **约束规则**: 通过外键、唯一约束等保证数据完整性
4. **查询操作**: 通过SQL查询和操作数据

## 9. 实际查询示例

### 查看所有Schema（容器）
```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE 'tenant_%';
```

**结果**: 列出所有租户的schema名称

### 查看Schema中的表（内容）
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'tenant_test_company_a';
```

**结果**: 列出该租户schema中的所有业务表

### 查询数据（需要指定schema）
```sql
-- 方式1: 使用完整路径
SELECT * FROM tenant_test_company_a.exams;

-- 方式2: 设置search_path后直接查询
SET search_path TO tenant_test_company_a, public;
SELECT * FROM exams;  -- 自动在tenant_test_company_a中查找
```

## 10. 总结

- **Schema**: 是"容器"，用于组织和隔离，创建简单，不需要版本管理
- **业务表**: 是"内容"，存储实际数据，结构会变化，需要版本管理（Flyway）

在多租户系统中：
- 每个租户有**1个独立的Schema**（命名空间）
- 每个租户的Schema中有**多张相同的业务表**（但数据独立）
- Schema创建用SQL（简单直接）
- 业务表创建用Flyway（版本管理）

