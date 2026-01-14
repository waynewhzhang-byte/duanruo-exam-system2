# 租户Schema外键约束自动添加说明

## 概述

在创建新租户时，系统会自动为租户schema添加所有跨schema外键约束（引用`public.users.id`），无需手动执行SQL脚本。

## 实现位置

**文件**: `exam-infrastructure/src/main/java/com/duanruo/exam/infrastructure/multitenancy/SchemaManagementService.java`

**方法**: 
- `createSchemaForTenant()` - 创建新租户schema时自动调用
- `migrateExistingSchema()` - 迁移现有schema时自动调用
- `addForeignKeysToPublicUsers()` - 核心实现方法

## 自动添加的外键约束

系统会自动为以下表添加外键约束：

1. **exam_reviewers.reviewer_id** → `public.users.id`
   - 约束名: `fk_exam_reviewers_reviewer`
   - 删除策略: `CASCADE`

2. **reviews.reviewer_id** → `public.users.id`
   - 约束名: `fk_reviews_reviewer`
   - 删除策略: `CASCADE`

3. **review_tasks.assigned_to** → `public.users.id`
   - 约束名: `fk_review_tasks_assigned_to`
   - 删除策略: `SET NULL` (可为空)

4. **exam_scores.graded_by** → `public.users.id`
   - 约束名: `fk_exam_scores_graded_by`
   - 删除策略: `SET NULL` (可为空)

5. **exam_admins.admin_id** → `public.users.id`
   - 约束名: `fk_exam_admins_admin`
   - 删除策略: `CASCADE`

6. **exam_admins.created_by** → `public.users.id`
   - 约束名: `fk_exam_admins_created_by`
   - 删除策略: `SET NULL` (可为空)

## 执行流程

### 创建新租户时

```
1. 创建Schema
   ↓
2. 设置search_path
   ↓
3. 创建业务表（Flyway迁移）
   ↓
4. 自动添加外键约束 ← 新增步骤
   ↓
5. 完成
```

### 迁移现有Schema时

```
1. 检查Schema是否存在
   ↓
2. 执行Flyway迁移
   ↓
3. 自动添加外键约束 ← 新增步骤
   ↓
4. 完成
```

## 特性

### 1. 幂等性
- 方法会先检查约束是否已存在
- 如果约束已存在，跳过添加
- 可以安全地多次调用

### 2. 容错性
- 如果表不存在，跳过该表的外键约束添加
- 如果添加失败，记录警告日志但不中断流程
- 确保schema创建流程不会因外键约束问题而失败

### 3. 日志记录
- 记录每个外键约束的添加状态
- 记录跳过和失败的情况
- 便于排查问题

## 手动修复（可选）

如果需要为所有现有租户schema批量添加外键约束，可以使用：

**脚本**: `scripts/add-missing-foreign-keys.sql`

**执行方式**:
```bash
psql -h localhost -U postgres -d duanruo-exam-system -f scripts/add-missing-foreign-keys.sql
```

**使用场景**:
- 修复历史数据（在代码集成之前创建的schema）
- 批量更新所有现有schema
- 验证外键约束完整性

## 验证

### 检查特定schema的外键约束

```sql
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'tenant_test_company_a'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'users'
ORDER BY tc.table_name, tc.constraint_name;
```

## 注意事项

1. **跨Schema外键**: PostgreSQL支持跨schema外键约束，但JPA/Hibernate不支持直接映射。需要在数据库层面维护这些约束。

2. **表创建顺序**: 外键约束的添加依赖于表已存在。如果表还未创建（例如新的migration脚本），约束会在下次迁移时自动添加。

3. **性能影响**: 添加外键约束会检查现有数据。如果表中已有大量数据，可能需要一些时间。

4. **数据完整性**: 外键约束确保：
   - 无法插入不存在的用户ID
   - 删除用户时，相关记录会被级联删除或设置为NULL

## 相关文档

- `docs/database-baseline-summary.md` - 数据库基线总结
- `docs/database-structure-verification.md` - 数据库结构验证报告

