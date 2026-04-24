# 代码质量优化重构设计

**日期**: 2026-04-24
**状态**: 已确认
**策略**: 4 阶段迭代

---

## 背景

对项目进行全面分析后，发现以下核心问题：
- 前端 164 处 `as any`，ESLint 未启用类型安全规则
- 后端 80+ 处硬编码状态字符串，无共享枚举
- 三种 API 响应格式并存
- 数据库关键字段缺少索引，存在多处 N+1 查询
- 测试覆盖率极低（后端 12%，前端 3.4%）
- 多个大文件需拆分（`api-hooks.ts` 2361 行，`ExamController` 432 行）

---

## 第一阶段：类型安全 & 枚举规范化

### 1.1 前端 ESLint 严格规则

**目标**: 启用类型安全检查，逐步消除 `as any`

**文件**: `web/.eslintrc.json`

在现有配置基础上增加：
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**消除 `as any` 顺序**（按影响面从大到小）：
1. `lib/api-hooks.ts` - 40+ 处，定义正确的 API 返回类型替代
2. domain components (`Exam*.tsx`, `Seating*.tsx`) - 30+ 处，用 proper types
3. forms 和 dialogs - 20+ 处，用 Zod schema 类型
4. 其余文件

每个文件的 PR 独立，避免大爆炸修改。

### 1.2 后端状态枚举定义

**目标**: 替换 80+ 处硬编码字符串

**新文件**: `server/src/common/enums/`

```
server/src/common/enums/
  exam-status.enum.ts
  application-status.enum.ts
  user-status.enum.ts
  tenant-status.enum.ts
  payment-status.enum.ts
  review-status.enum.ts
  index.ts
```

枚举示例：
```typescript
export enum ExamStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  AUTO_PASSED = 'AUTO_PASSED',
  AUTO_REJECTED = 'AUTO_REJECTED',
  PENDING_PRIMARY_REVIEW = 'PENDING_PRIMARY_REVIEW',
  PRIMARY_PASSED = 'PRIMARY_PASSED',
  PRIMARY_REJECTED = 'PRIMARY_REJECTED',
  PENDING_SECONDARY_REVIEW = 'PENDING_SECONDARY_REVIEW',
  APPROVED = 'APPROVED',
  SECONDARY_REJECTED = 'SECONDARY_REJECTED',
  PAID = 'PAID',
  TICKET_ISSUED = 'TICKET_ISSUED',
}
```

**替换策略**: 在每个 service 文件中逐步替换，优先处理高频文件：
1. `exam.service.ts` - 12+ 处
2. `statistics.service.ts` - 15+ 处
3. `seating.service.ts` - 10+ 处
4. `review.service.ts` - 8+ 处

### 1.3 权限字符串类型化

**目标**: 编译时权限拼写检查

**文件**: `server/src/auth/permissions.types.ts`

```typescript
export const PermissionCodes = {
  EXAM_CREATE: 'exam:create',
  EXAM_VIEW: 'exam:view',
  EXAM_EDIT: 'exam:edit',
  EXAM_DELETE: 'exam:delete',
  EXAM_PUBLISH: 'exam:publish',
  SEATING_VIEW: 'seating:view',
  SEATING_CREATE: 'seating:create',
  SEATING_EDIT: 'seating:edit',
  SEATING_DELETE: 'seating:delete',
  SEATING_ALLOCATE: 'seating:allocate',
  // ... all permissions
} as const;

export type PermissionCode = typeof PermissionCodes[keyof typeof PermissionCodes];
```

更新 `@Permissions()` 装饰器为类型安全的参数。

### 1.4 Prisma Schema 枚举约束

**目标**: 数据库层面校验状态值

```prisma
enum ExamStatus {
  DRAFT
  REGISTRATION_OPEN
  OPEN
  CLOSED
}

enum ApplicationStatus {
  DRAFT
  SUBMITTED
  ...
}
```

相应的 model 字段从 `String @db.VarChar(50)` 改为 `ExamStatus @default(DRAFT)`。

---

## 第二阶段：响应格式统一 & 模块拆分

### 2.1 API 响应格式统一

**目标**: 全项目统一使用 `ApiResult<T>`

**统一格式**:
```typescript
{
  success: boolean;
  message: string;
  data: T;
}
```

**迁移清单**:
- `SeatingController` - 替换 `ApiResponse.success()` 为 `ApiResult.ok()`
- `ExamController` - 已使用 `ApiResult`，移除手动拼装的部分
- 前端 `schemas.ts` - 确保 Zod schema 能解析统一格式

### 2.2 大文件拆分

**后端**:

| 原文件 | 拆分后 |
|--------|--------|
| `exam.controller.ts` (432行) | `exam.controller.ts` + `exam-rules.controller.ts` + `exam-ticketing.controller.ts` |
| `exam.service.ts` (~400行) | `exam.service.ts` + `exam-rules.service.ts` |

**前端**:

| 原文件 | 拆分后 |
|--------|--------|
| `api-hooks.ts` (2361行) | `hooks/exam.ts`, `hooks/application.ts`, `hooks/seating.ts`, `hooks/payment.ts`, `hooks/ticket.ts`, `hooks/review.ts`, `hooks/user.ts` |
| `schemas.ts` (1289行) | `schemas/exam.ts`, `schemas/application.ts`, `schemas/seating.ts`... |
| `AdminLayout.tsx` (437行) | `AdminLayout.tsx` + `AdminSidebar.tsx` + `AdminHeader.tsx` |

### 2.3 路由规范化

| 当前 | 修正后 |
|------|--------|
| `POST /form-templates?examId=X` | `POST /exams/X/form-templates` |
| `PUT /form-templates/:id/batch?examId=X` | `PUT /exams/X/form-templates/:id/batch` |
| `POST /form-templates/:id/publish?examId=X` | `POST /exams/X/form-templates/:id/publish` |
| `DELETE /subjects/:id` | `DELETE /exams/positions/:positionId/subjects/:id` |

---

## 第三阶段：数据库优化

### 3.1 添加关键索引

**文件**: `server/prisma/schema.prisma`

```prisma
model Application {
  // 现有字段...

  @@index([candidateId])
  @@index([examId])
  @@index([positionId])
  @@index([status])
}

model FileRecord {
  @@index([applicationId])
  @@index([uploadedBy])
  @@index([status])
}

model Notification {
  @@index([tenantId, createdAt])
}
```

### 3.2 N+1 查询修复

| 位置 | 问题 | 修复 |
|------|------|------|
| `seating.service.ts:161-185` | 循环逐个更新 ticket | 批量查询 venues/rooms 入 Map，批量 update |
| `score.service.ts:274-315` | `batchCalculateEligibility` 逐个计算 | 使用 `$transaction` 批量操作 |
| `score.service.ts:159-205` | `batchImportScores` 逐条 upsert | `createMany` + `updateMany` 批处理 |
| `exam.service.ts:254-289` | 串行 N 个租户查询 | `Promise.allSettled` 并行化 |
| `statistics.service.ts:234-244` | 串行遍历租户统计 | 并行聚合 |

### 3.3 清理

- 删除 `server/prisma/db_current_schema.prisma`（已过时，schema 不一致）

---

## 第四阶段：测试补全 & 收尾

### 4.1 核心测试

**后端测试**（优先覆盖最复杂的业务逻辑）:

| 测试文件 | 覆盖内容 |
|----------|----------|
| `seating.service.spec.ts` | 坐位分配算法、N+1 修复验证 |
| `review.service.spec.ts` | 审核任务分配、pullNext |
| `ticket.service.spec.ts` | 准考证生成、批量生成 |
| `statistics.service.spec.ts` | 统计聚合逻辑 |

**前端测试**:

| 测试文件 | 覆盖内容 |
|----------|----------|
| `ExamApplicationForm.test.tsx` | 表单模板创建流程 |
| `api-hooks.test.ts` | 关键 API hook 的 query/mutation 行为 |

### 4.2 死代码清理

| 清理项 | 处理方式 |
|--------|----------|
| 9 个 `Tenant*Page` 壳页 | 提取为 `createTenantRedirectPage(target)` 工厂函数 |
| `api-hooks.ts:1811-1911` 被注释代码 | 删除（25 行） |
| `lib/tenant-api.ts` | 删除（与 `api.ts` 功能重复） |
| `lib/api/client-generated.ts` | 评估是否需要保留，OpenAPI 已过期 |

### 4.3 配置外部化

| 当前硬编码 | 改为 |
|-----------|------|
| `http://localhost:3000` (8 处) | `process.env.FRONTEND_URL` |
| `minioadmin/minioadmin` (2 处) | `ConfigService` 读取 |
| `http://localhost:8081` (middleware) | `process.env.BACKEND_INTERNAL_URL` |

---

## 风险与注意事项

1. **枚举迁移影响面大** - 80+ 处替换需要在同一 PR 中完成，否则会出现不一致
2. **Prisma enum 需迁移** - `db push` 需要确认 PostgreSQL 兼容性
3. **响应格式统一** - 前端有 80+ hooks，需逐一验证 parse 逻辑
4. **索引添加** - 生产环境需要 `CREATE INDEX CONCURRENTLY` 避免锁表
5. **测试补全** - 依赖真实数据库，需要 test fixture/seeding

---

## 验收标准

每个阶段完成后验证：
- **Phase 1**: `web` 无新增 `as any`；后端无直接状态字符串比较
- **Phase 2**: 前后端统一 `ApiResult`；大文件拆分为 300 行以内
- **Phase 3**: 无 N+1 查询（通过 Prisma 日志验证）；索引生效
- **Phase 4**: 测试覆盖率提升到 30%+；无硬编码凭据
