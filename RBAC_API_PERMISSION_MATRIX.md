# RBAC API权限矩阵

**文档版本**: 1.0  
**创建日期**: 2025-11-02  
**验证状态**: ✅ 已通过代码分析验证

---

## 📋 目录

1. [权限命名规范](#权限命名规范)
2. [角色权限总览](#角色权限总览)
3. [API权限映射表](#api权限映射表)
4. [权限分类详解](#权限分类详解)

---

## 权限命名规范

### 命名格式

```
{RESOURCE}_{ACTION}[_{SCOPE}]
```

### 命名示例

| 权限名称 | 资源 | 操作 | 范围 | 说明 |
|---------|------|------|------|------|
| `EXAM_CREATE` | EXAM | CREATE | - | 创建考试 |
| `EXAM_VIEW` | EXAM | VIEW | - | 查看考试 |
| `APPLICATION_VIEW_OWN` | APPLICATION | VIEW | OWN | 查看自己的申请 |
| `APPLICATION_VIEW_ALL` | APPLICATION | VIEW | ALL | 查看所有申请 |
| `FILE_VIEW_OWN` | FILE | VIEW | OWN | 查看自己的文件 |
| `STATISTICS_SYSTEM_VIEW` | STATISTICS | VIEW | SYSTEM | 查看系统级统计 |

### 操作类型 (ACTION)

- `CREATE` - 创建
- `UPDATE` - 更新
- `DELETE` - 删除
- `VIEW` - 查看
- `MANAGE` - 管理
- `EXPORT` - 导出
- `IMPORT` - 导入
- `APPROVE` - 批准
- `REJECT` - 拒绝

### 范围类型 (SCOPE)

- `OWN` - 自己的资源
- `ALL` - 所有资源
- `ASSIGNED` - 分配给自己的资源
- `TENANT` - 租户级别
- `SYSTEM` - 系统级别

---

## 角色权限总览

### 角色权限统计

| 角色 | 权限数量 | 权限级别 | 主要职责 |
|------|---------|---------|---------|
| **SUPER_ADMIN** | 100+ | 系统级 | 管理所有租户和系统配置 |
| **TENANT_ADMIN** | 65 | 租户级 | 管理租户内所有事务 |
| **EXAM_ADMIN** | 30+ | 考试级 | 管理特定考试 |
| **PRIMARY_REVIEWER** | 5 | 审核级 | 一级审核 |
| **SECONDARY_REVIEWER** | 5 | 审核级 | 二级审核 |
| **CANDIDATE** | 7 | 用户级 | 考生自助服务 |
| **EXAMINER** | 4 | 验证级 | 准考证验证 |

### 角色权限矩阵

| 权限类别 | SUPER_ADMIN | TENANT_ADMIN | EXAM_ADMIN | PRIMARY_REVIEWER | SECONDARY_REVIEWER | CANDIDATE | EXAMINER |
|---------|-------------|--------------|------------|------------------|-------------------|-----------|----------|
| **考试管理** | ✅ 全部 | ✅ 全部 | ✅ 部分 | ❌ | ❌ | ❌ | ❌ |
| **岗位管理** | ✅ 全部 | ✅ 全部 | ✅ 部分 | ❌ | ❌ | ❌ | ❌ |
| **申请管理** | ✅ 全部 | ✅ 全部 | ✅ 查看 | ✅ 查看分配 | ✅ 查看分配 | ✅ 自己的 | ❌ |
| **审核管理** | ✅ 全部 | ✅ 全部 | ❌ | ✅ 一级 | ✅ 二级 | ❌ | ❌ |
| **准考证管理** | ✅ 全部 | ✅ 全部 | ✅ 部分 | ❌ | ❌ | ✅ 查看自己 | ✅ 验证 |
| **成绩管理** | ✅ 全部 | ✅ 全部 | ✅ 部分 | ❌ | ❌ | ✅ 查看自己 | ❌ |
| **文件管理** | ✅ 全部 | ✅ 全部 | ✅ 查看 | ✅ 查看 | ✅ 查看 | ✅ 自己的 | ❌ |
| **租户管理** | ✅ 全部 | ✅ 租户内 | ❌ | ❌ | ❌ | ❌ | ❌ |
| **用户管理** | ✅ 全部 | ✅ 租户内 | ❌ | ❌ | ❌ | ❌ | ❌ |
| **统计报表** | ✅ 全部 | ✅ 租户级 | ✅ 考试级 | ❌ | ❌ | ❌ | ❌ |

---

## API权限映射表

### 1. 考试管理 API (ExamController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| POST | `/exams` | 创建考试 | `EXAM_CREATE` | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| GET | `/exams` | 查看考试列表 | `EXAM_VIEW` | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| GET | `/exams/{examId}` | 查看考试详情 | `EXAM_VIEW` | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| PUT | `/exams/{examId}` | 更新考试 | `EXAM_UPDATE` | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| DELETE | `/exams/{examId}` | 删除考试 | `EXAM_DELETE` | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/exams/{examId}/open` | 开放考试 | `EXAM_OPEN` | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/exams/{examId}/close` | 关闭考试 | `EXAM_CLOSE` | SUPER_ADMIN, TENANT_ADMIN |

### 2. 岗位管理 API (PositionController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| POST | `/positions` | 创建岗位 | `POSITION_CREATE` | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| GET | `/positions` | 查看岗位列表 | `POSITION_VIEW` | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| GET | `/positions/{positionId}` | 查看岗位详情 | `POSITION_VIEW` | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| PUT | `/positions/{positionId}` | 更新岗位 | `POSITION_UPDATE` | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| DELETE | `/positions/{positionId}` | 删除岗位 | `POSITION_DELETE` | SUPER_ADMIN, TENANT_ADMIN |

### 3. 科目管理 API (SubjectController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| POST | `/positions/{positionId}/subjects` | 创建科目 | `SUBJECT_CREATE` | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/positions/{positionId}/subjects` | 查看科目列表 | `SUBJECT_VIEW` | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| PUT | `/subjects/{subjectId}` | 更新科目 | `SUBJECT_UPDATE` | SUPER_ADMIN, TENANT_ADMIN |
| DELETE | `/subjects/{subjectId}` | 删除科目 | `SUBJECT_DELETE` | SUPER_ADMIN, TENANT_ADMIN |

### 4. 申请管理 API (ApplicationController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| POST | `/applications` | 创建申请 | `APPLICATION_CREATE` | CANDIDATE |
| GET | `/applications/my` | 查看自己的申请 | `APPLICATION_VIEW_OWN` | CANDIDATE |
| GET | `/applications` | 查看所有申请 | `APPLICATION_VIEW_ALL` | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/applications/{applicationId}` | 查看申请详情 | `APPLICATION_VIEW_OWN` 或 `APPLICATION_VIEW_ALL` | CANDIDATE(自己的), SUPER_ADMIN, TENANT_ADMIN |
| PUT | `/applications/{applicationId}` | 更新申请 | `APPLICATION_UPDATE_OWN` | CANDIDATE(自己的) |
| DELETE | `/applications/{applicationId}` | 删除申请 | `APPLICATION_DELETE_OWN` | CANDIDATE(自己的) |

### 5. 审核管理 API (ReviewController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| GET | `/reviews/pending` | 查看待审核列表 | `REVIEW_PRIMARY` 或 `REVIEW_SECONDARY` | PRIMARY_REVIEWER, SECONDARY_REVIEWER, TENANT_ADMIN |
| POST | `/reviews/{applicationId}/primary` | 一级审核 | `REVIEW_PRIMARY` | PRIMARY_REVIEWER, TENANT_ADMIN |
| POST | `/reviews/{applicationId}/secondary` | 二级审核 | `REVIEW_SECONDARY` | SECONDARY_REVIEWER, TENANT_ADMIN |
| GET | `/reviews/statistics` | 审核统计 | `REVIEW_STATISTICS` | SUPER_ADMIN, TENANT_ADMIN |

### 6. 准考证管理 API (TicketController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| POST | `/tickets/generate` | 生成准考证 | `TICKET_GENERATE` | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/tickets/batch-generate` | 批量生成准考证 | `TICKET_BATCH_GENERATE` | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/tickets/my` | 查看自己的准考证 | `TICKET_VIEW_OWN` | CANDIDATE |
| GET | `/tickets/{ticketId}` | 查看准考证详情 | `TICKET_VIEW` | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/tickets/{ticketId}/validate` | 验证准考证 | `TICKET_VALIDATE` | EXAMINER, TENANT_ADMIN |
| GET | `/tickets/{ticketId}/download` | 下载准考证 | `TICKET_DOWNLOAD` | CANDIDATE(自己的), TENANT_ADMIN |

### 7. 成绩管理 API (ScoreController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| POST | `/scores` | 录入成绩 | `SCORE_RECORD` | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/scores/batch-import` | 批量导入成绩 | `SCORE_BATCH_IMPORT` | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/scores/my` | 查看自己的成绩 | `SCORE_VIEW_OWN` | CANDIDATE |
| GET | `/scores` | 查看所有成绩 | `SCORE_VIEW` | SUPER_ADMIN, TENANT_ADMIN |
| PUT | `/scores/{scoreId}` | 更新成绩 | `SCORE_UPDATE` | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/scores/statistics` | 成绩统计 | `SCORE_STATISTICS` | SUPER_ADMIN, TENANT_ADMIN |

### 8. 文件管理 API (FileController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| POST | `/files/upload` | 上传文件 | `FILE_UPLOAD` | CANDIDATE, TENANT_ADMIN |
| GET | `/files/my` | 查看自己的文件 | `FILE_VIEW_OWN` | CANDIDATE |
| GET | `/files` | 查看所有文件 | `FILE_VIEW` | SUPER_ADMIN, TENANT_ADMIN, PRIMARY_REVIEWER, SECONDARY_REVIEWER |
| GET | `/files/{fileId}` | 查看文件详情 | `FILE_VIEW_OWN` 或 `FILE_VIEW` | CANDIDATE(自己的), TENANT_ADMIN, REVIEWER |
| DELETE | `/files/{fileId}` | 删除文件 | `FILE_DELETE` | SUPER_ADMIN, TENANT_ADMIN |

### 9. 租户管理 API (TenantController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| POST | `/tenants` | 创建租户 | `TENANT_CREATE` | SUPER_ADMIN |
| GET | `/tenants` | 查看所有租户 | `TENANT_VIEW_ALL` | SUPER_ADMIN |
| GET | `/tenants/{tenantId}` | 查看租户详情 | `TENANT_VIEW` | SUPER_ADMIN, TENANT_ADMIN(自己的) |
| PUT | `/tenants/{tenantId}` | 更新租户 | `TENANT_UPDATE` | SUPER_ADMIN |
| DELETE | `/tenants/{tenantId}` | 删除租户 | `TENANT_DELETE` | SUPER_ADMIN |

### 10. 用户管理 API (UserController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| POST | `/users` | 创建用户 | `USER_MANAGE` | SUPER_ADMIN |
| GET | `/users` | 查看所有用户 | `USER_MANAGE` | SUPER_ADMIN |
| GET | `/tenants/{tenantId}/users` | 查看租户用户 | `TENANT_USER_MANAGE` | SUPER_ADMIN, TENANT_ADMIN |
| PUT | `/users/{userId}` | 更新用户 | `USER_MANAGE` | SUPER_ADMIN |
| DELETE | `/users/{userId}` | 删除用户 | `USER_MANAGE` | SUPER_ADMIN |

### 11. 统计报表 API (StatisticsController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| GET | `/statistics/overview` | 查看统计概览 | `STATISTICS_VIEW` | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/statistics/tenant/{tenantId}` | 查看租户统计 | `STATISTICS_TENANT_VIEW` | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/statistics/system` | 查看系统统计 | `STATISTICS_SYSTEM_VIEW` | SUPER_ADMIN |
| GET | `/statistics/exam/{examId}` | 查看考试统计 | `STATISTICS_VIEW` | SUPER_ADMIN, TENANT_ADMIN |

### 12. PII合规 API (PIIComplianceController)

| HTTP方法 | 路径 | 功能 | 所需权限 | 拥有该权限的角色 |
|---------|------|------|---------|----------------|
| POST | `/pii/export` | 导出个人数据 | `PII_EXPORT` | SUPER_ADMIN, TENANT_ADMIN |
| POST | `/pii/anonymize` | 匿名化数据 | `PII_ANONYMIZE` | SUPER_ADMIN, TENANT_ADMIN |
| DELETE | `/pii/{userId}` | 删除个人数据 | `PII_DELETE` | SUPER_ADMIN, TENANT_ADMIN |
| GET | `/pii/audit` | 查看PII审计日志 | `PII_AUDIT` | SUPER_ADMIN |

---

## 权限分类详解

### 1. 考试管理权限 (EXAM_*)

| 权限名称 | 说明 | 拥有该权限的角色 |
|---------|------|----------------|
| `EXAM_CREATE` | 创建考试 | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| `EXAM_UPDATE` | 更新考试信息 | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| `EXAM_DELETE` | 删除考试 | SUPER_ADMIN, TENANT_ADMIN |
| `EXAM_VIEW` | 查看考试信息 | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| `EXAM_OPEN` | 开放考试报名 | SUPER_ADMIN, TENANT_ADMIN |
| `EXAM_CLOSE` | 关闭考试报名 | SUPER_ADMIN, TENANT_ADMIN |
| `EXAM_FORM_CONFIG` | 配置报名表单 | SUPER_ADMIN, TENANT_ADMIN |
| `EXAM_VENUE_MANAGE` | 管理考场 | SUPER_ADMIN, TENANT_ADMIN |
| `EXAM_SCHEDULE_MANAGE` | 管理考试日程 | SUPER_ADMIN, TENANT_ADMIN |

### 2. 岗位管理权限 (POSITION_*)

| 权限名称 | 说明 | 拥有该权限的角色 |
|---------|------|----------------|
| `POSITION_CREATE` | 创建岗位 | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| `POSITION_UPDATE` | 更新岗位信息 | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| `POSITION_DELETE` | 删除岗位 | SUPER_ADMIN, TENANT_ADMIN |
| `POSITION_VIEW` | 查看岗位信息 | SUPER_ADMIN, TENANT_ADMIN, EXAM_ADMIN |
| `POSITION_FORM_CONFIG` | 配置岗位表单 | SUPER_ADMIN, TENANT_ADMIN |

### 3. 申请管理权限 (APPLICATION_*)

| 权限名称 | 说明 | 拥有该权限的角色 |
|---------|------|----------------|
| `APPLICATION_CREATE` | 创建申请 | CANDIDATE |
| `APPLICATION_VIEW_OWN` | 查看自己的申请 | CANDIDATE |
| `APPLICATION_VIEW_ALL` | 查看所有申请 | SUPER_ADMIN, TENANT_ADMIN |
| `APPLICATION_VIEW_ASSIGNED` | 查看分配给自己的申请 | PRIMARY_REVIEWER, SECONDARY_REVIEWER |
| `APPLICATION_UPDATE_OWN` | 更新自己的申请 | CANDIDATE |
| `APPLICATION_DELETE_OWN` | 删除自己的申请 | CANDIDATE |
| `APPLICATION_BULK_OPERATION` | 批量操作申请 | SUPER_ADMIN, TENANT_ADMIN |

### 4. 审核权限 (REVIEW_*)

| 权限名称 | 说明 | 拥有该权限的角色 |
|---------|------|----------------|
| `REVIEW_PRIMARY` | 一级审核 | PRIMARY_REVIEWER, TENANT_ADMIN |
| `REVIEW_SECONDARY` | 二级审核 | SECONDARY_REVIEWER, TENANT_ADMIN |
| `REVIEW_STATISTICS` | 查看审核统计 | SUPER_ADMIN, TENANT_ADMIN |
| `REVIEW_BATCH` | 批量审核 | SUPER_ADMIN, TENANT_ADMIN |

### 5. 准考证权限 (TICKET_*)

| 权限名称 | 说明 | 拥有该权限的角色 |
|---------|------|----------------|
| `TICKET_GENERATE` | 生成准考证 | SUPER_ADMIN, TENANT_ADMIN |
| `TICKET_BATCH_GENERATE` | 批量生成准考证 | SUPER_ADMIN, TENANT_ADMIN |
| `TICKET_VIEW_OWN` | 查看自己的准考证 | CANDIDATE |
| `TICKET_VIEW` | 查看所有准考证 | SUPER_ADMIN, TENANT_ADMIN |
| `TICKET_VALIDATE` | 验证准考证 | EXAMINER, TENANT_ADMIN |
| `TICKET_DOWNLOAD` | 下载准考证 | CANDIDATE, TENANT_ADMIN |

### 6. 成绩权限 (SCORE_*)

| 权限名称 | 说明 | 拥有该权限的角色 |
|---------|------|----------------|
| `SCORE_RECORD` | 录入成绩 | SUPER_ADMIN, TENANT_ADMIN |
| `SCORE_VIEW_OWN` | 查看自己的成绩 | CANDIDATE |
| `SCORE_VIEW` | 查看所有成绩 | SUPER_ADMIN, TENANT_ADMIN |
| `SCORE_UPDATE` | 更新成绩 | SUPER_ADMIN, TENANT_ADMIN |
| `SCORE_STATISTICS` | 成绩统计 | SUPER_ADMIN, TENANT_ADMIN |
| `SCORE_BATCH_IMPORT` | 批量导入成绩 | SUPER_ADMIN, TENANT_ADMIN |

### 7. 文件权限 (FILE_*)

| 权限名称 | 说明 | 拥有该权限的角色 |
|---------|------|----------------|
| `FILE_UPLOAD` | 上传文件 | CANDIDATE, TENANT_ADMIN |
| `FILE_VIEW_OWN` | 查看自己的文件 | CANDIDATE |
| `FILE_VIEW` | 查看所有文件 | SUPER_ADMIN, TENANT_ADMIN, REVIEWER |
| `FILE_DELETE` | 删除文件 | SUPER_ADMIN, TENANT_ADMIN |

### 8. 租户权限 (TENANT_*)

| 权限名称 | 说明 | 拥有该权限的角色 |
|---------|------|----------------|
| `TENANT_CREATE` | 创建租户 | SUPER_ADMIN |
| `TENANT_UPDATE` | 更新租户信息 | SUPER_ADMIN |
| `TENANT_DELETE` | 删除租户 | SUPER_ADMIN |
| `TENANT_VIEW` | 查看租户信息 | SUPER_ADMIN, TENANT_ADMIN(自己的) |
| `TENANT_VIEW_ALL` | 查看所有租户 | SUPER_ADMIN |
| `TENANT_USER_MANAGE` | 管理租户用户 | SUPER_ADMIN, TENANT_ADMIN |

### 9. 用户权限 (USER_*)

| 权限名称 | 说明 | 拥有该权限的角色 |
|---------|------|----------------|
| `USER_MANAGE` | 管理所有用户 | SUPER_ADMIN |
| `TENANT_USER_MANAGE` | 管理租户内用户 | SUPER_ADMIN, TENANT_ADMIN |

### 10. 统计权限 (STATISTICS_*)

| 权限名称 | 说明 | 拥有该权限的角色 |
|---------|------|----------------|
| `STATISTICS_VIEW` | 查看统计信息 | SUPER_ADMIN, TENANT_ADMIN |
| `STATISTICS_TENANT_VIEW` | 查看租户统计 | SUPER_ADMIN, TENANT_ADMIN |
| `STATISTICS_SYSTEM_VIEW` | 查看系统统计 | SUPER_ADMIN |

### 11. PII合规权限 (PII_*)

| 权限名称 | 说明 | 拥有该权限的角色 |
|---------|------|----------------|
| `PII_EXPORT` | 导出个人数据 | SUPER_ADMIN, TENANT_ADMIN |
| `PII_ANONYMIZE` | 匿名化数据 | SUPER_ADMIN, TENANT_ADMIN |
| `PII_DELETE` | 删除个人数据 | SUPER_ADMIN, TENANT_ADMIN |
| `PII_AUDIT` | 查看PII审计日志 | SUPER_ADMIN |

---

## 权限使用最佳实践

### 1. 最小权限原则

✅ **正确做法**:
- 只授予用户完成工作所需的最小权限集
- 使用细粒度权限而非粗粒度角色
- 定期审查和调整权限

❌ **错误做法**:
- 给所有用户授予SUPER_ADMIN角色
- 使用角色名而非权限名进行权限检查
- 长期不审查权限分配

### 2. 权限检查位置

✅ **正确做法**:
- 在Controller方法上使用@PreAuthorize注解
- 在Service层进行业务级权限检查
- 在数据访问层进行数据级权限过滤

❌ **错误做法**:
- 只在前端进行权限检查
- 在多个地方重复权限检查逻辑
- 硬编码权限检查

### 3. 权限命名

✅ **正确做法**:
- 使用统一的命名规范: {RESOURCE}_{ACTION}[_{SCOPE}]
- 权限名称清晰表达其用途
- 保持权限名称的一致性

❌ **错误做法**:
- 使用模糊的权限名称
- 权限名称不一致
- 使用角色名作为权限名

---

**文档结束**

