# 前端租户ID传递修复总结

## 问题描述

在多租户架构中，前端调用租户特定资源的API时，必须传递 `X-Tenant-ID` header，否则后端无法正确设置租户上下文（PostgreSQL `search_path`），导致权限验证失败。

**原始错误：** "用户不属于此租户" (Access denied: User does not belong to this tenant)

## 根本原因

前端的 mutation hooks 使用 `apiPost`、`apiPut`、`apiDelete` 等函数，但没有传递 `tenantId` 参数，导致请求中缺少 `X-Tenant-ID` header。

## 修复方案

所有租户特定资源的创建/更新/删除操作，统一使用 `apiPostWithTenant`、`apiPutWithTenant`、`apiDeleteWithTenant` 函数，并传递 `tenantId` 参数。

## 已修复的 Hooks

### 1. Position（岗位）管理
- ✅ `useCreatePosition` - 创建岗位（mutation）
- ✅ `useUpdatePosition` - 更新岗位（mutation）
- ✅ `useDeletePosition` - 删除岗位（mutation）
- ✅ `useExamPositions` - 查询岗位列表（query）

### 2. Subject（科目）管理
- ✅ `useCreateSubject` - 创建科目（mutation）
- ✅ `useUpdateSubject` - 更新科目（mutation）
- ✅ `useDeleteSubject` - 删除科目（mutation）
- ✅ 科目列表查询 - 在 `ExamPositionsAndSubjects.tsx` 中使用 `apiGetWithTenant`

### 3. Venue（考场）管理
- ✅ `useCreateVenue` - 创建考场（mutation）
- ✅ `useUpdateVenue` - 更新考场（mutation）
- ✅ `useDeleteVenue` - 删除考场（mutation）
- ✅ `useExamVenues` - 查询考场列表（query）

### 4. Exam（考试）管理
- ✅ `useUpdateExamAnnouncement` - 更新考试公告（mutation）
- ✅ `useOpenExam` - 开放考试（mutation）
- ✅ `useCloseExam` - 关闭考试（mutation）
- ✅ `useDeleteExam` - 删除考试（mutation）
- ✅ `useUpdateExamRules` - 更新考试规则（mutation）
- ✅ `useUpdateExamFormTemplate` - 更新报名表单模板（mutation）
- ✅ `useUpdateExamAutoReviewRules` - 更新自动审核规则（mutation）
- ✅ `useExamRules` - 查询考试规则（query）

### 5. Reviewer（审核员）管理
- ✅ `useAddReviewer` - 添加审核员（mutation）
- ✅ `useRemoveReviewer` - 移除审核员（mutation）

### 6. Seat Assignment（座位分配）
- ✅ `useAllocateSeats` - 分配座位（mutation）
- ✅ `useClearSeatAssignments` - 清除座位分配（mutation）

### 7. Ticket（准考证）管理
- ✅ `useTicketTemplate` - 查询准考证模板（query）
- ✅ `useTicketStatistics` - 查询准考证统计（query）

## 使用示例

### Mutation Hooks 修复示例

#### 修复前（错误）
```typescript
const createMutation = useCreatePosition()
await createMutation.mutateAsync(data) // ❌ 缺少 tenantId
```

#### 修复后（正确）
```typescript
const createMutation = useCreatePosition()
const { tenant } = useTenant()

await createMutation.mutateAsync({
  ...data,
  tenantId: tenant.id  // ✅ 传递 tenantId
})
```

### Query Hooks 修复示例

#### 修复前（错误）
```typescript
const { data: positions } = useExamPositions(examId) // ❌ 缺少 tenantId
```

#### 修复后（正确）
```typescript
const { tenant } = useTenant()
const { data: positions } = useExamPositions(examId, tenant?.id) // ✅ 传递 tenantId
```

## 已修复的组件

### 考试详情页面组件（`web/src/components/admin/exam-detail/`）
- ✅ `ExamPositionsAndSubjects.tsx` - 岗位和科目管理（查询岗位、查询科目、删除岗位、删除科目）
- ✅ `ExamVenues.tsx` - 考场管理
- ✅ `ExamReviewRules.tsx` - 审核规则
- ✅ `ExamApplications.tsx` - 报名管理
- ✅ `ExamReviewers.tsx` - 审核员管理
- ✅ `ExamSeating.tsx` - 座位分配
- ✅ `ExamScores.tsx` - 成绩管理
- ✅ `CreatePositionDialog.tsx` - 创建岗位对话框

### 对话框组件（`web/src/components/admin/`）
- ✅ `CreateSubjectDialog.tsx` - 创建科目对话框（使用 `useCreateSubject` hook）
- ✅ `EditSubjectDialog.tsx` - 编辑科目对话框（传递 `tenantId`）

### 其他页面组件
- ✅ `web/src/app/[tenantSlug]/admin/exams/[examId]/tickets/page.tsx` - 准考证模板配置
- ✅ `web/src/app/[tenantSlug]/candidate/exams/[id]/positions/page.tsx` - 考生选择岗位
- ✅ `web/src/app/[tenantSlug]/exams/[examId]/page.tsx` - 考试详情页面

## 不需要修复的 Hooks

以下 hooks 不需要传递 tenantId：

### 全局操作
- `useCreateTenant` - 超级管理员创建租户
- `useUpdateTenant` - 超级管理员更新租户
- `useActivateTenant` - 超级管理员激活租户
- `useDeactivateTenant` - 超级管理员停用租户

### 从资源ID推断租户
- `useSubmitApplication` - 从 examId 推断租户
- `usePayApplication` - 从 applicationId 推断租户
- `useWithdrawApplication` - 从 applicationId 推断租户
- `useRecordScore` - 从 applicationId 推断租户

### 认证相关
- `useLogin` - 全局登录
- `useLogout` - 全局登出
- `useRegister` - 全局注册

## 考生跨租户访问

考生（CANDIDATE）是特殊角色，可以报名多个租户的考试：

1. **注册**：全局操作，不需要 tenantId
2. **浏览考试**：需要选择租户，传递 tenantId
3. **报名**：传递 tenantId（从考试信息中获取）
4. **查看我的报名**：
   - 短期方案：前端手工选择租户，分别查询
   - 长期方案：后端提供跨租户查询API

## 后端权限验证逻辑

后端 `TenantInterceptor` 的验证逻辑：

1. **SUPER_ADMIN**：直接放行，不检查 `user_tenant_roles`
2. **租户级别角色**（TENANT_ADMIN, REVIEWER, CANDIDATE）：检查 `user_tenant_roles` 表

即使是 SUPER_ADMIN，也需要传递 tenantId 来指定操作的租户上下文。

## 测试建议

1. 测试租户管理员创建岗位、科目、考场等操作
2. 测试审核员管理、座位分配等功能
3. 测试考生在不同租户间切换并报名
4. 验证所有API请求都包含 `X-Tenant-ID` header

## 相关文档

- `docs/architecture/sso-user-model-refactoring.md` - SSO用户模型重构
- `docs/architecture/saas-multitenancy-and-subjects.md` - 多租户架构设计
- `docs/security-guidelines.md` - 安全开发规范

