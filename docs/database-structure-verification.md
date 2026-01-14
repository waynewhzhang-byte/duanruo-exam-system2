# 数据库结构验证报告

## 检查时间
2025-01-XX

## 检查范围
- Public Schema: 全局共享表（tenants, users, user_tenant_roles）
- Tenant Schema: 租户业务表（applications, exam_reviewers, reviews等）

## 1. Public Schema 表结构 ✅

### 1.1 `public.users` 表
- **状态**: ✅ 正确实现
- **主键**: `id` (UUID)
- **关键字段**: 
  - `username`, `email`, `password_hash`, `full_name`, `phone_number`
  - `status`, `roles`, `email_verified`, `phone_verified`
- **索引**: 已创建必要的索引（username, email, phone_number, status等）
- **外键引用**: 被以下表引用：
  - `public.user_tenant_roles.user_id` ✅
  - `tenant_*.applications.candidate_id` ✅ (跨schema外键)

### 1.2 `public.user_tenant_roles` 表
- **状态**: ✅ 正确实现
- **主键**: `id` (UUID)
- **关键字段**:
  - `user_id` → `public.users.id` (外键) ✅
  - `tenant_id` → `public.tenants.id` (外键) ✅
  - `role` (CANDIDATE, PRIMARY_REVIEWER, SECONDARY_REVIEWER, TENANT_ADMIN, EXAMINER)
  - `active` (boolean)
- **唯一约束**: `(user_id, tenant_id, role)` ✅

### 1.3 `public.tenants` 表
- **状态**: ✅ 正确实现
- **主键**: `id` (UUID)
- **关键字段**: `name`, `code`, `schema_name`, `status`
- **外键引用**: 被 `public.user_tenant_roles.tenant_id` 引用 ✅

## 2. Tenant Schema 表结构

### 2.1 `applications` 表 ✅
- **状态**: ✅ 正确实现
- **关键字段**: `candidate_id` (UUID)
- **外键约束**: ✅ `candidate_id` → `public.users.id` (跨schema外键)
- **约束名称**: `fk_applications_candidate`

### 2.2 `exam_reviewers` 表 ⚠️
- **状态**: ⚠️ 缺少外键约束
- **关键字段**: `reviewer_id` (UUID)
- **外键约束**: ❌ **缺失** - `reviewer_id` 应该引用 `public.users.id`
- **建议**: 添加跨schema外键约束：
  ```sql
  ALTER TABLE exam_reviewers
  ADD CONSTRAINT fk_exam_reviewers_reviewer
  FOREIGN KEY (reviewer_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;
  ```

### 2.3 `reviews` 表 ⚠️
- **状态**: ⚠️ 缺少外键约束
- **关键字段**: `reviewer_id` (UUID)
- **外键约束**: ❌ **缺失** - `reviewer_id` 应该引用 `public.users.id`
- **建议**: 添加跨schema外键约束：
  ```sql
  ALTER TABLE reviews
  ADD CONSTRAINT fk_reviews_reviewer
  FOREIGN KEY (reviewer_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;
  ```

### 2.4 `review_tasks` 表 ⚠️
- **状态**: ⚠️ 缺少外键约束
- **关键字段**: `assigned_to` (UUID, nullable)
- **外键约束**: ❌ **缺失** - `assigned_to` 应该引用 `public.users.id`
- **建议**: 添加跨schema外键约束（注意：字段可为NULL）：
  ```sql
  ALTER TABLE review_tasks
  ADD CONSTRAINT fk_review_tasks_assigned_to
  FOREIGN KEY (assigned_to)
  REFERENCES public.users(id)
  ON DELETE SET NULL;
  ```

### 2.5 `exam_scores` 表 ⚠️
- **状态**: ⚠️ 缺少外键约束
- **关键字段**: `graded_by` (UUID, nullable)
- **外键约束**: ❌ **缺失** - `graded_by` 应该引用 `public.users.id`
- **建议**: 添加跨schema外键约束（注意：字段可为NULL）：
  ```sql
  ALTER TABLE exam_scores
  ADD CONSTRAINT fk_exam_scores_graded_by
  FOREIGN KEY (graded_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;
  ```

### 2.6 `exam_admins` 表 ⚠️
- **状态**: ⚠️ 缺少外键约束
- **关键字段**: 
  - `admin_id` (UUID)
  - `created_by` (UUID, nullable)
- **外键约束**: ❌ **缺失** - 两个字段都应该引用 `public.users.id`
- **建议**: 添加跨schema外键约束：
  ```sql
  ALTER TABLE exam_admins
  ADD CONSTRAINT fk_exam_admins_admin
  FOREIGN KEY (admin_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

  ALTER TABLE exam_admins
  ADD CONSTRAINT fk_exam_admins_created_by
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;
  ```

### 2.7 `files` 表 ⚠️
- **状态**: ⚠️ 字段类型不一致
- **关键字段**: `uploaded_by (character varying)`
- **问题**: 字段类型是 `VARCHAR` 而不是 `UUID`，无法建立外键约束
- **建议**: 
  - 如果存储的是用户ID，应改为 `UUID` 类型并添加外键约束
  - 如果存储的是用户名，则保持现状（但需要应用层验证）

## 3. 数据关系验证

### 3.1 用户-租户-角色关系 ✅
- **实现方式**: `public.user_tenant_roles` 表
- **关系**: 多对多（一个用户可以在多个租户中拥有不同角色）
- **状态**: ✅ 正确实现

### 3.2 候选人关联 ✅
- **实现方式**: `tenant_*.applications.candidate_id` → `public.users.id`
- **关系**: 候选人通过报名记录关联到租户
- **状态**: ✅ 正确实现（有外键约束）

### 3.3 审核员关联 ⚠️
- **实现方式**: 
  - `public.user_tenant_roles` (role = PRIMARY_REVIEWER/SECONDARY_REVIEWER) ✅
  - `tenant_*.exam_reviewers.reviewer_id` ⚠️ (缺少外键约束)
  - `tenant_*.reviews.reviewer_id` ⚠️ (缺少外键约束)
- **状态**: 部分实现，需要添加外键约束

## 4. 总结

### ✅ 已正确实现
1. Public schema 表结构完整
2. `applications.candidate_id` 外键约束正确
3. `user_tenant_roles` 表正确关联用户和租户

### ⚠️ 需要修复
1. `exam_reviewers.reviewer_id` 缺少外键约束
2. `reviews.reviewer_id` 缺少外键约束
3. `review_tasks.assigned_to` 缺少外键约束
4. `exam_scores.graded_by` 缺少外键约束
5. `exam_admins.admin_id` 和 `created_by` 缺少外键约束
6. `files.uploaded_by` 字段类型需要确认（VARCHAR vs UUID）

### 建议
1. 为所有引用 `public.users.id` 的 UUID 字段添加跨schema外键约束
2. 确认 `files.uploaded_by` 的用途，如果是用户ID则改为UUID类型
3. 考虑创建数据库迁移脚本统一修复这些问题

