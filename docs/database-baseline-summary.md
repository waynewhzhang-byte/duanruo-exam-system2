# 数据库结构基线总结

## 更新时间
2025-01-XX

## 概述
本文档记录了数据库结构的基线状态，包括所有表结构、外键约束和Entity定义。

## 1. Public Schema 表结构

### 1.1 `public.users` 表
- **主键**: `id` (UUID)
- **关键字段**: 
  - `username`, `email`, `password_hash`, `full_name`, `phone_number`
  - `status`, `roles`, `email_verified`, `phone_verified`
- **索引**: username, email, phone_number, status, created_at, last_login_at
- **外键引用**: 被以下表引用（跨schema外键）：
  - `public.user_tenant_roles.user_id`
  - `tenant_*.applications.candidate_id`
  - `tenant_*.exam_reviewers.reviewer_id`
  - `tenant_*.reviews.reviewer_id`
  - `tenant_*.review_tasks.assigned_to`
  - `tenant_*.exam_scores.graded_by`
  - `tenant_*.exam_admins.admin_id`
  - `tenant_*.exam_admins.created_by`

### 1.2 `public.user_tenant_roles` 表
- **主键**: `id` (UUID)
- **外键**:
  - `user_id` → `public.users.id`
  - `tenant_id` → `public.tenants.id`
- **唯一约束**: `(user_id, tenant_id, role)`
- **角色类型**: CANDIDATE, PRIMARY_REVIEWER, SECONDARY_REVIEWER, TENANT_ADMIN, EXAMINER

### 1.3 `public.tenants` 表
- **主键**: `id` (UUID)
- **关键字段**: `name`, `code`, `schema_name`, `status`
- **外键引用**: 被 `public.user_tenant_roles.tenant_id` 引用

## 2. Tenant Schema 表结构（跨Schema外键）

### 2.1 `applications` 表
- **外键约束**: ✅ `fk_applications_candidate`
  - `candidate_id` → `public.users.id` (ON DELETE CASCADE)
- **Entity**: `ApplicationEntity`
- **注释**: 已在Entity中添加外键关系说明

### 2.2 `exam_reviewers` 表
- **外键约束**: ✅ `fk_exam_reviewers_reviewer`
  - `reviewer_id` → `public.users.id` (ON DELETE CASCADE)
- **Entity**: `ExamReviewerEntity`
- **注释**: 已在Entity中添加外键关系说明

### 2.3 `reviews` 表
- **外键约束**: ✅ `fk_reviews_reviewer`
  - `reviewer_id` → `public.users.id` (ON DELETE CASCADE)
- **Entity**: `ReviewEntity`
- **注释**: 已在Entity中添加外键关系说明

### 2.4 `review_tasks` 表
- **外键约束**: ✅ `fk_review_tasks_assigned_to`
  - `assigned_to` → `public.users.id` (ON DELETE SET NULL, nullable)
- **Entity**: `ReviewTaskEntity`
- **注释**: 已在Entity中添加外键关系说明

### 2.5 `exam_scores` 表
- **外键约束**: ✅ `fk_exam_scores_graded_by`
  - `graded_by` → `public.users.id` (ON DELETE SET NULL, nullable)
- **Entity**: `ExamScoreEntity`
- **注释**: 已在Entity中添加外键关系说明

### 2.6 `exam_admins` 表
- **外键约束**: 
  - ✅ `fk_exam_admins_admin`: `admin_id` → `public.users.id` (ON DELETE CASCADE)
  - ✅ `fk_exam_admins_created_by`: `created_by` → `public.users.id` (ON DELETE SET NULL, nullable)
- **Entity**: `ExamAdminEntity`
- **注释**: 已在Entity中添加外键关系说明

### 2.7 `files` 表
- **字段**: `uploaded_by` (VARCHAR, 不是UUID)
- **说明**: 此字段存储的是用户名或其他标识，不是用户ID，因此不需要外键约束
- **Entity**: `FileEntity`

## 3. Entity定义更新

所有引用 `public.users.id` 的Entity字段都已添加注释，说明：
1. 外键约束名称
2. 跨schema外键关系
3. JPA不支持直接映射的说明

### 更新的Entity文件：
- `ApplicationEntity.java` - `candidate_id` 字段
- `ExamReviewerEntity.java` - `reviewer_id` 字段
- `ReviewEntity.java` - `reviewer_id` 字段
- `ReviewTaskEntity.java` - `assigned_to` 字段
- `ExamScoreEntity.java` - `graded_by` 字段
- `ExamAdminEntity.java` - `admin_id` 和 `created_by` 字段

## 4. 数据库维护脚本

### 4.1 自动添加外键约束（代码集成）
- **位置**: `SchemaManagementService.addForeignKeysToPublicUsers()`
- **功能**: 在创建新租户schema时自动添加所有跨schema外键约束
- **触发时机**:
  - 创建新租户时（`createSchemaForTenant()`）
  - 迁移现有schema时（`migrateExistingSchema()`）
- **状态**: ✅ 已集成到代码中

### 4.2 手动添加外键约束脚本（用于修复现有schema）
- **文件**: `scripts/add-missing-foreign-keys.sql`
- **功能**: 为所有现有租户schema批量添加缺失的外键约束
- **执行方式**: 直接执行SQL脚本，不依赖Flyway
- **使用场景**: 修复历史数据或批量更新现有schema
- **状态**: ✅ 已执行并验证

### 4.2 验证查询
```sql
-- 查看所有跨schema外键约束
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
WHERE tc.table_schema LIKE 'tenant_%'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'users'
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;
```

## 5. 注意事项

1. **跨Schema外键**: PostgreSQL支持跨schema外键约束，但JPA/Hibernate不支持直接映射。需要在数据库层面维护这些约束。

2. **数据完整性**: 所有外键约束都已正确添加，确保数据完整性：
   - 删除用户时，相关记录会被级联删除（CASCADE）或设置为NULL（SET NULL）
   - 无法插入不存在的用户ID

3. **新租户Schema**: 当创建新租户时，`SchemaManagementService.createSchemaForTenant()` 会自动：
   - 创建schema和业务表
   - **自动添加所有跨schema外键约束**（引用public.users.id）
   - 无需手动执行 `add-missing-foreign-keys.sql` 脚本

4. **Flyway迁移**: 由于直接执行过DDL，Flyway迁移历史可能不完整。建议：
   - 不再依赖Flyway进行结构迁移
   - 直接使用SQL脚本维护数据库结构
   - 保持Entity定义与数据库结构同步

## 6. 后续维护

1. **新表添加**: 如果添加新表并需要引用 `public.users.id`，需要：
   - 在表结构中添加UUID字段
   - 执行SQL添加外键约束
   - 在Entity中添加注释说明

2. **结构变更**: 任何数据库结构变更都应该：
   - 先更新数据库（直接SQL）
   - 再更新Entity定义
   - 更新本文档

3. **验证**: 定期执行验证查询，确保所有外键约束都存在且正确。

