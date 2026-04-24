# 代码质量优化重构实施计划 - 第一阶段：类型安全 & 枚举规范化

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立编译时类型安全保障，消除前后端 API 不一致的根源

**Architecture:** 后端定义共享枚举 + 权限类型化 → 前端启用严格 ESLint + 逐步消除 `as any` → Prisma schema 添加枚举约束

**Tech Stack:** TypeScript strict mode, NestJS enum patterns, ESLint + typescript-eslint, Prisma enum, Zod schema inference

---

### Task 1: 定义后端共享状态枚举

**Files:**
- Create: `server/src/common/enums/exam-status.enum.ts`
- Create: `server/src/common/enums/application-status.enum.ts`
- Create: `server/src/common/enums/user-status.enum.ts`
- Create: `server/src/common/enums/tenant-status.enum.ts`
- Create: `server/src/common/enums/payment-status.enum.ts`
- Create: `server/src/common/enums/review-status.enum.ts`
- Create: `server/src/common/enums/ticket-status.enum.ts`
- Create: `server/src/common/enums/index.ts`

- [ ] **Step 1: 创建 ExamStatus 枚举**

```typescript
// server/src/common/enums/exam-status.enum.ts
export enum ExamStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}
```

- [ ] **Step 2: 创建 ApplicationStatus 枚举**

```typescript
// server/src/common/enums/application-status.enum.ts
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

- [ ] **Step 3: 创建 UserStatus 枚举**

```typescript
// server/src/common/enums/user-status.enum.ts
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
```

- [ ] **Step 4: 创建 TenantStatus 枚举**

```typescript
// server/src/common/enums/tenant-status.enum.ts
export enum TenantStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
```

- [ ] **Step 5: 创建 PaymentStatus 枚举**

```typescript
// server/src/common/enums/payment-status.enum.ts
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}
```

- [ ] **Step 6: 创建 ReviewStatus 枚举**

```typescript
// server/src/common/enums/review-status.enum.ts
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
```

- [ ] **Step 7: 创建 TicketStatus 枚举**

```typescript
// server/src/common/enums/ticket-status.enum.ts
export enum TicketStatus {
  GENERATED = 'GENERATED',
  DOWNLOADED = 'DOWNLOADED',
  PRINTED = 'PRINTED',
  CANCELLED = 'CANCELLED',
}
```

- [ ] **Step 8: 创建 barrel export**

```typescript
// server/src/common/enums/index.ts
export { ExamStatus } from './exam-status.enum';
export { ApplicationStatus } from './application-status.enum';
export { UserStatus } from './user-status.enum';
export { TenantStatus } from './tenant-status.enum';
export { PaymentStatus } from './payment-status.enum';
export { ReviewStatus } from './review-status.enum';
export { TicketStatus } from './ticket-status.enum';
```

- [ ] **Step 9: 验证编译**

Run: `cd server && npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 10: 提交**

```bash
cd server && git add src/common/enums/ && git commit -m "feat(server): add shared domain status enums"
```

---

### Task 2: 替换后端高频文件中的硬编码状态字符串

**Files:**
- Modify: `server/src/exam/exam.service.ts` (12+ 处状态字符串)
- Modify: `server/src/exam/exam.controller.ts` (5+ 处)
- Modify: `server/src/seating/seating.service.ts` (10+ 处)
- Modify: `server/src/seating/seating.controller.ts` (4+ 处)
- Modify: `server/src/review/review.service.ts` (8+ 处)
- Modify: `server/src/statistics/statistics.service.ts` (15+ 处)

- [ ] **Step 1: 替换 exam.service.ts 中的状态字符串**

导入枚举：
```typescript
import { ExamStatus, ApplicationStatus } from '../common/enums';
```

替换示例（`exam.service.ts` 中）：
```typescript
// Before:
where: { status: 'OPEN' }
// After:
where: { status: ExamStatus.OPEN }

// Before:
if (exam.status !== 'DRAFT')
// After:
if (exam.status !== ExamStatus.DRAFT)

// Before:
data: { status: 'REGISTRATION_OPEN' }
// After:
data: { status: ExamStatus.REGISTRATION_OPEN }
```

- [ ] **Step 2: 替换 exam.controller.ts 中的状态字符串**

导入枚举，替换 `exam.service.ts` line 168 `'OPEN'` 等状态字符串。

- [ ] **Step 3: 替换 seating.service.ts 中的状态字符串**

```typescript
import { ExamStatus, ApplicationStatus } from '../common/enums';

// Before: where: { status: 'APPROVED' }
// After: where: { status: ApplicationStatus.APPROVED }
```

- [ ] **Step 4: 替换 review.service.ts 中的状态字符串**

```typescript
import { ApplicationStatus, ReviewStatus } from '../common/enums';

// Before: status: 'PENDING'
// After: status: ReviewStatus.PENDING
```

- [ ] **Step 5: 替换 statistics.service.ts 中的状态字符串**

替换 15+ 处硬编码状态，包括 `getTenantStatistics()` 中的 `'APPROVED'`、`'REJECTED'`、`'PAID'` 等。

- [ ] **Step 6: 验证编译和测试**

Run: `cd server && npx tsc --noEmit && npm test`
Expected: All tests pass

- [ ] **Step 7: 提交**

```bash
cd server && git add -A && git commit -m "refactor(server): replace hardcoded status strings with enums"
```

---

### Task 3: 权限字符串类型化

**Files:**
- Create: `server/src/auth/permissions.types.ts`
- Modify: `server/src/auth/permissions.decorator.ts`
- Modify: `server/src/auth/permissions.guard.ts`

- [ ] **Step 1: 创建权限类型定义**

```typescript
// server/src/auth/permissions.types.ts
export const PermissionCodes = {
  // Exam
  EXAM_CREATE: 'exam:create',
  EXAM_VIEW: 'exam:view',
  EXAM_VIEW_ALL: 'exam:view:all',
  EXAM_EDIT: 'exam:edit',
  EXAM_DELETE: 'exam:delete',
  EXAM_PUBLISH: 'exam:publish',
  EXAM_OPEN: 'exam:open',
  EXAM_CLOSE: 'exam:close',

  // Position
  POSITION_VIEW: 'position:view',
  POSITION_CREATE: 'position:create',
  POSITION_EDIT: 'position:edit',
  POSITION_DELETE: 'position:delete',

  // Seating
  SEATING_VIEW: 'seating:view',
  SEATING_VIEW_ALL: 'seating:view:all',
  SEATING_CREATE: 'seating:create',
  SEATING_EDIT: 'seating:edit',
  SEATING_DELETE: 'seating:delete',
  SEATING_ALLOCATE: 'seating:allocate',

  // Review
  REVIEW_VIEW: 'review:view',
  REVIEW_VIEW_ALL: 'review:view:all',
  REVIEW_PERFORM: 'review:perform',

  // Application
  APPLICATION_VIEW: 'application:view',
  APPLICATION_VIEW_ALL: 'application:view:all',
  APPLICATION_VIEW_OWN: 'application:view:own',
  APPLICATION_SUBMIT: 'application:submit',

  // Payment
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_VIEW_ALL: 'payment:view:all',
  PAYMENT_PAY: 'payment:pay',
  PAYMENT_PAY_OWN: 'payment:pay:own',

  // Ticket
  TICKET_VIEW: 'ticket:view',
  TICKET_VIEW_ALL: 'ticket:view:all',
  TICKET_VIEW_OWN: 'ticket:view:own',
  TICKET_GENERATE: 'ticket:generate',
  TICKET_BATCH_GENERATE: 'ticket:batch-generate',

  // File
  FILE_VIEW: 'file:view',
  FILE_VIEW_ALL: 'file:view:all',
  FILE_DELETE: 'file:delete',
  FILE_UPLOAD: 'file:upload',

  // User
  USER_VIEW: 'user:view',
  USER_VIEW_ALL: 'user:view:all',
  USER_CREATE: 'user:create',

  // Statistics
  STATISTICS_SYSTEM_VIEW: 'statistics:system:view',
  STATISTICS_TENANT_VIEW: 'statistics:tenant:view',
} as const;

export type PermissionCode = typeof PermissionCodes[keyof typeof PermissionCodes];
```

- [ ] **Step 2: 更新 Permissions 装饰器**

```typescript
// server/src/auth/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from './permissions.types';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: PermissionCode[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

- [ ] **Step 3: 更新所有 controller 中的 @Permissions() 调用**

替换所有裸字符串为 `PermissionCodes` 常量：

```typescript
// Before:
@Permissions('exam:view')
// After:
import { PermissionCodes } from '../auth/permissions.types';
@Permissions(PermissionCodes.EXAM_VIEW)
```

涉及文件：`exam.controller.ts`、`seating.controller.ts`、`review.controller.ts`、`application.controller.ts`、`payment.controller.ts` 等。

- [ ] **Step 4: 验证编译**

Run: `cd server && npx tsc --noEmit`
Expected: 拼写错误的权限会立即报编译错误

- [ ] **Step 5: 提交**

```bash
cd server && git add -A && git commit -m "refactor(server): add typed permission codes and update decorator"
```

---

### Task 4: Prisma Schema 枚举约束

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: 添加 Prisma 枚举定义**

在 schema.prisma 顶部（datasource 之后）添加：

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
  AUTO_PASSED
  AUTO_REJECTED
  PENDING_PRIMARY_REVIEW
  PRIMARY_PASSED
  PRIMARY_REJECTED
  PENDING_SECONDARY_REVIEW
  APPROVED
  SECONDARY_REJECTED
  PAID
  TICKET_ISSUED
}

enum TenantStatus {
  PENDING
  ACTIVE
  INACTIVE
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  CANCELLED
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}

enum TicketStatus {
  GENERATED
  DOWNLOADED
  PRINTED
  CANCELLED
}
```

- [ ] **Step 2: 替换模型字段类型**

```prisma
model Exam {
  // Before: status String @db.VarChar(50) @default("DRAFT")
  status ExamStatus @default(DRAFT)
}

model Application {
  // Before: status String @db.VarChar(50) @default("DRAFT")
  status ApplicationStatus @default(DRAFT)
}

model Tenant {
  // Before: status String @db.VarChar(20) @default("PENDING")
  status TenantStatus @default(PENDING)
}

model PaymentOrder {
  // Before: status String @db.VarChar(50) @default("PENDING")
  status PaymentStatus @default(PENDING)
}

model Review {
  // Before: decision String @db.VarChar(20)?
  decision ReviewStatus?
}

model Ticket {
  // Before: status String @db.VarChar(50)?
  status TicketStatus?
}
```

- [ ] **Step 3: 运行 Prisma migrate**

Run: `cd server && npx prisma migrate dev --name add_status_enums`
Expected: 生成迁移文件

- [ ] **Step 4: 验证后端编译**

Run: `cd server && npx tsc --noEmit && npm test`
Expected: 测试通过（如果之前用 enum 替换了字符串）

- [ ] **Step 5: 提交**

```bash
cd server && git add -A && git commit -m "feat(prisma): add status enums with database constraints"
```

---

### Task 5: 前端 ESLint 严格规则启用

**Files:**
- Modify: `web/.eslintrc.json`

- [ ] **Step 1: 安装 typescript-eslint 插件**

```bash
cd web && npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

- [ ] **Step 2: 更新 ESLint 配置**

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
```

- [ ] **Step 3: 运行 lint 查看问题数**

Run: `cd web && npm run lint 2>&1 | grep "no-explicit-any" | wc -l`
Expected: 显示约 164 个 warning（不阻断构建）

- [ ] **Step 4: 提交**

```bash
cd web && git add .eslintrc.json package.json package-lock.json && git commit -m "chore(web): enable @typescript-eslint strict rules (warn mode)"
```

---

### Task 6: 消除 api-hooks.ts 中的 `as any`

**Files:**
- Modify: `web/src/lib/api-hooks.ts`

- [ ] **Step 1: 导出更精确的 API 返回类型**

在 `schemas.ts` 中已有的类型不够用于 hook 的地方，直接定义返回类型：

```typescript
// 在 api-hooks.ts 顶部添加通用返回类型
interface ApiResult<T> {
  success: boolean
  message: string
  data: T
}
```

- [ ] **Step 2: 替换 `useQuery<any[]>` 为具体类型**

```typescript
// Before:
const { data: positions } = useQuery<any[]>({ ... })

// After: 使用已有的 PositionResponse 类型
import type { PositionResponse } from '@/types/exam'
const { data: positions } = useQuery<PositionResponse[]>({ ... })
```

- [ ] **Step 3: 替换 `mutationFn: async (data: any)` 为具体类型**

```typescript
// Before:
mutationFn: async (data: any) => {

// After:
mutationFn: async (data: ExamCreateRequest & { tenantId?: string }) => {
```

- [ ] **Step 4: 替换 `(response as any)` 转换**

```typescript
// Before:
const items = (response as any).items || []

// After:
interface VenueListResponse { items: Venue[] }
const data = response as VenueListResponse
const items = data.items || []
```

- [ ] **Step 5: 验证编译**

Run: `cd web && npx tsc --noEmit`
Expected: 与之前相同或更少的错误

- [ ] **Step 6: 提交**

```bash
cd web && git add src/lib/api-hooks.ts && git commit -m "refactor(web): replace 'any' types in api-hooks.ts with proper types"
```

---

### Task 7: 消除 ExamDetail 组件中的 `as any`

**Files:**
- Modify: `web/src/components/admin/exam-detail/ExamSeating.tsx`
- Modify: `web/src/components/admin/exam-detail/ExamVenues.tsx`
- Modify: `web/src/components/admin/exam-detail/ExamPositionsAndSubjects.tsx`
- Modify: `web/src/components/admin/exam-detail/ExamScores.tsx`

- [ ] **Step 1: 定义 ExamSeating 组件中的具体类型**

```typescript
// ExamSeating.tsx
interface Venue {
  venueId: string
  name: string
  capacity: number
}

// Replace: venues.map((venue: any) => ...)
// With: venues.map((venue: Venue) => ...)
```

- [ ] **Step 2: 替换 ExamVenues 中的 `as any`**

```typescript
// ExamVenues.tsx
// Before: (venue: any) =>
// After: (venue: { id: string; name: string; capacity: number; rooms?: any[] }) =>
```

- [ ] **Step 3: 替换 ExamPositionsAndSubjects 中的 `as any`**

```typescript
// Before: const currentPosition = positions?.find((p: any) => ...)
// After: const currentPosition = positions?.find((p) => p.id === selectedPositionId)
```

- [ ] **Step 4: 替换 ExamScores 中的 `as any`**

定义 `Subject`、`Score`、`Application` 接口并替换所有 `as any` 引用。

- [ ] **Step 5: 验证 lint**

Run: `cd web && npm run lint 2>&1 | grep "no-explicit-any" | wc -l`
Expected: 数量显著减少

- [ ] **Step 6: 提交**

```bash
cd web && git add src/components/admin/exam-detail/ && git commit -m "refactor(web): remove 'as any' from exam detail components"
```

---

### Task 8: 第一阶段验证

- [ ] **Step 1: 后端全面检查**

```bash
cd server && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 2: 前端全面检查**

```bash
cd web && npx tsc --noEmit && npm run lint
```

- [ ] **Step 3: 端到端冒烟测试**

手动验证：
1. 登录 admin/demo 租户
2. 查看考试列表、创建考试
3. 创建岗位和科目
4. 查看成绩管理页面
5. 确认所有功能正常

- [ ] **Step 4: 提交验证结果**

```bash
git add -A && git commit -m "chore: phase 1 verification - all checks pass"
```

---

## 第二阶段：响应格式统一 & 模块拆分

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 统一 API 响应格式，拆分过大的文件和控制器

**Architecture:** 全部改用 `ApiResult<T>` → 大文件按职责拆分 → 路由规范化

**Tech Stack:** NestJS, TanStack React Query, Zod, TypeScript

---

### Task 9: 统一后端响应格式

**Files:**
- Modify: `server/src/seating/seating.controller.ts`
- Modify: `server/src/exam/exam.controller.ts`
- Modify: `server/src/application/application.controller.ts`

- [ ] **Step 1: 替换 SeatingController 的 ApiResponse 为 ApiResult**

```typescript
// seating.controller.ts
// Before:
import { ApiResponse } from '../common/dto/api-response.dto';
return ApiResponse.success(venues);

// After:
import { ApiResult } from '../common/dto/api-result.dto';
return ApiResult.ok(venues);
```

替换所有 8 个 endpoint 中的 `ApiResponse.success()` 为 `ApiResult.ok()`。

- [ ] **Step 2: 清理 ExamController 中的手动响应格式**

```typescript
// Before (exam.controller.ts:104-112):
return { success: true, data: { content, total, page, size } };

// After:
return ApiResult.ok({ content, total, page, size });
```

- [ ] **Step 3: 应用 controller 同样的替换**

```typescript
// application.controller.ts - 确保返回值使用 ApiResult 包装
return ApiResult.ok(apps);
return ApiResult.ok(drafts);
```

- [ ] **Step 4: 删除 ApiResponse 文件**

```bash
rm server/src/common/dto/api-response.dto.ts
```

- [ ] **Step 5: 验证编译和测试**

Run: `cd server && npx tsc --noEmit && npm test`
Expected: 无编译错误，测试通过

- [ ] **Step 6: 提交**

```bash
cd server && git add -A && git commit -m "refactor(server): unify API response format to ApiResult<T>"
```

---

### Task 10: 拆分 ExamController

**Files:**
- Create: `server/src/exam/exam-rules.controller.ts`
- Create: `server/src/exam/exam-rules.service.ts`
- Modify: `server/src/exam/exam.controller.ts`
- Modify: `server/src/exam/exam.service.ts`
- Modify: `server/src/exam/exam.module.ts`

- [ ] **Step 1: 创建 ExamRulesController**

```typescript
// server/src/exam/exam-rules.controller.ts
import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiResult } from '../common/dto/api-result.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { TenantGuard } from '../auth/tenant.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionCodes } from '../auth/permissions.types';
import { ExamRulesService } from './exam-rules.service';

@Controller('exams')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ExamRulesController {
  constructor(private readonly rulesService: ExamRulesService) {}

  @Get(':examId/rules')
  @Permissions(PermissionCodes.EXAM_VIEW)
  async getExamRules(@Param('examId') examId: string) {
    const rules = await this.rulesService.getExamRules(examId);
    return ApiResult.ok(rules);
  }

  @Put(':examId/rules')
  @Permissions(PermissionCodes.EXAM_EDIT)
  async updateExamRules(@Param('examId') examId: string, @Body() request: any) {
    const rules = await this.rulesService.updateExamRules(examId, request);
    return ApiResult.ok(rules);
  }

  @Get('positions/:positionId/rules')
  @Permissions(PermissionCodes.POSITION_VIEW)
  async getPositionRules(@Param('positionId') positionId: string) {
    const rules = await this.rulesService.getPositionRules(positionId);
    return ApiResult.ok(rules);
  }

  @Put('positions/:positionId/rules')
  @Permissions(PermissionCodes.POSITION_EDIT)
  async updatePositionRules(@Param('positionId') positionId: string, @Body() request: any) {
    const rules = await this.rulesService.updatePositionRules(positionId, request);
    return ApiResult.ok(rules);
  }
}
```

- [ ] **Step 2: 创建 ExamRulesService**

```typescript
// server/src/exam/exam-rules.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamRulesService {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma.client;
  }

  async getExamRules(examId: string) {
    const exam = await this.client.exam.findUnique({
      where: { id: examId },
      select: { rulesConfig: true },
    });
    return (exam as any)?.rulesConfig || { rules: [] };
  }

  async updateExamRules(examId: string, rulesConfig: any) {
    await this.client.exam.update({
      where: { id: examId },
      data: { rulesConfig },
    });
    return rulesConfig;
  }

  async getPositionRules(positionId: string) {
    const position = await this.client.position.findUnique({
      where: { id: positionId },
      select: { requirements: true },
    });
    return (position as any)?.requirements || { rules: [] };
  }

  async updatePositionRules(positionId: string, requirements: any) {
    await this.client.position.update({
      where: { id: positionId },
      data: { requirements },
    });
    return requirements;
  }
}
```

- [ ] **Step 3: 从 ExamController 删除规则端点**

删除 `exam.controller.ts` 中的 `getExamRules`、`updateExamRules`、`getPositionRules`、`updatePositionRules` 方法。

- [ ] **Step 4: 从 ExamService 删除规则方法**

删除 `exam.service.ts` 中的 rules 相关逻辑。

- [ ] **Step 5: 注册新模块**

```typescript
// exam.module.ts - 添加新 controller 和 service
import { ExamRulesController } from './exam-rules.controller';
import { ExamRulesService } from './exam-rules.service';

@Module({
  controllers: [
    ExamController,
    PositionController,
    FormTemplateController,
    ScoreController,
    PublishedExamController,
    PublicExamController,
    ExamRulesController,  // 新增
  ],
  providers: [
    ExamService,
    PositionService,
    ExamRulesService,  // 新增
    ScoreService,
  ],
})
```

- [ ] **Step 6: 验证编译和测试**

Run: `cd server && npx tsc --noEmit && npm test`
Expected: 所有测试通过

- [ ] **Step 7: 提交**

```bash
cd server && git add -A && git commit -m "refactor(server): extract ExamRulesController and ExamRulesService from ExamController"
```

---

### Task 11: 拆分前端大文件 - api-hooks.ts

**Files:**
- Create: `web/src/lib/hooks/exam.ts`
- Create: `web/src/lib/hooks/application.ts`
- Create: `web/src/lib/hooks/seating.ts`
- Create: `web/src/lib/hooks/payment.ts`
- Create: `web/src/lib/hooks/ticket.ts`
- Create: `web/src/lib/hooks/review.ts`
- Create: `web/src/lib/hooks/user.ts`
- Create: `web/src/lib/hooks/form-template.ts`
- Create: `web/src/lib/hooks/index.ts`
- Modify: `web/src/lib/api-hooks.ts` (保留 barrel export)

- [ ] **Step 1: 提取 queryKeys 到独立文件**

```typescript
// web/src/lib/query-keys.ts
export const queryKeys = {
  exams: {
    all: ['exams'] as const,
    detail: (id: string) => ['exams', id] as const,
    positions: (examId: string) => ['exams', examId, 'positions'] as const,
    // ... 从 api-hooks.ts 复制所有 queryKey
  },
  // ...
}
```

- [ ] **Step 2: 创建 hooks/exam.ts**

```typescript
// web/src/lib/hooks/exam.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGetWithTenant, apiPostWithTenant, apiPutWithTenant, apiDeleteWithTenant } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ExamResponse } from '@/types/exam';

export function useExamList(tenantId?: string) {
  return useQuery({
    queryKey: queryKeys.exams.all,
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID required');
      return apiGetWithTenant<ExamResponse[]>('/exams', tenantId);
    },
    enabled: !!tenantId,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => { /* ... */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
    },
  });
}

// ... 复制所有 exam 相关的 hooks
```

- [ ] **Step 3: 创建其余 domain hook 文件**

同理拆分：`hooks/application.ts`、`hooks/seating.ts`、`hooks/payment.ts`、`hooks/ticket.ts`、`hooks/review.ts`、`hooks/user.ts`、`hooks/form-template.ts`

- [ ] **Step 4: 创建 barrel export**

```typescript
// web/src/lib/hooks/index.ts
export * from './exam';
export * from './application';
export * from './seating';
export * from './payment';
export * from './ticket';
export * from './review';
export * from './user';
export * from './form-template';
```

- [ ] **Step 5: 更新 api-hooks.ts 为 re-export**

```typescript
// web/src/lib/api-hooks.ts
export * from './hooks';
export * from './query-keys';
```

- [ ] **Step 6: 验证编译**

Run: `cd web && npx tsc --noEmit`
Expected: 所有 import 应该通过 barrel export 正确转发

- [ ] **Step 7: 提交**

```bash
cd web && git add -A && git commit -m "refactor(web): split api-hooks.ts into domain-specific hook files"
```

---

### Task 12: 拆分前端大文件 - AdminLayout.tsx

**Files:**
- Create: `web/src/components/layout/AdminSidebar.tsx`
- Create: `web/src/components/layout/AdminHeader.tsx`
- Modify: `web/src/components/layout/AdminLayout.tsx`

- [ ] **Step 1: 创建 AdminSidebar**

从 `AdminLayout.tsx` 提取 sidebar 渲染逻辑（约 100 行），包括导航菜单、角色过滤、租户切换。

```typescript
// web/src/components/layout/AdminSidebar.tsx
export default function AdminSidebar({ tenantSlug, userRoles }: AdminSidebarProps) {
  const navigation = useMemo(() => getNavigationForRoles(userRoles, tenantSlug), [userRoles, tenantSlug]);
  return (
    <aside className="...sidebar styles">
      <nav>
        {navigation.map((item) => (...))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: 创建 AdminHeader**

提取顶部栏（搜索、通知、用户菜单），约 50 行。

```typescript
// web/src/components/layout/AdminHeader.tsx
export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  return (
    <header className="...header styles">
      <SearchBar />
      <NotificationBell />
      <UserMenu />
    </header>
  );
}
```

- [ ] **Step 3: 简化 AdminLayout**

```typescript
// web/src/components/layout/AdminLayout.tsx (简化后 ~100 行)
export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const router = useRouter();

  if (!user) return <Spinner />;
  if (!hasAnyAdminRole(user.roles)) {
    router.replace('/login');
    return <Spinner />;
  }

  return (
    <div className="admin-layout">
      <AdminSidebar tenantSlug={tenant?.slug} userRoles={user.roles} />
      <div className="main-content">
        <AdminHeader />
        <main>{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 验证编译**

Run: `cd web && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
cd web && git add -A && git commit -m "refactor(web): extract AdminSidebar and AdminHeader from AdminLayout"
```

---

### Task 13: 路由规范化 - FormTemplate 的 examId

**Files:**
- Modify: `server/src/exam/form-template.controller.ts`
- Modify: `web/src/lib/api-hooks.ts`
- Modify: `web/src/components/admin/exam-detail/ExamApplicationForm.tsx`

- [ ] **Step 1: 更新后端路由**

```typescript
// form-template.controller.ts
// Before: @Controller('form-templates')
// After: @Controller('exams/:examId/form-templates')

@Controller('exams')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class FormTemplateController {
  @Post(':examId/form-templates')
  @Permissions(PermissionCodes.EXAM_CREATE)
  async create(@Param('examId') examId: string, @Body() data: any) {
    // ... examId 从路径参数获取
  }

  @Put(':examId/form-templates/:id/batch')
  @Permissions(PermissionCodes.EXAM_EDIT)
  async batchUpdate(@Param('examId') examId: string, @Param('id') id: string, @Body() data: any) {
    // ...
  }

  @Post(':examId/form-templates/:id/publish')
  @Permissions(PermissionCodes.EXAM_PUBLISH)
  async publish(@Param('examId') examId: string, @Param('id') id: string) {
    // ...
  }
}
```

- [ ] **Step 2: 更新前端 API 调用**

```typescript
// api-hooks.ts
// Before:
const url = examId
  ? `/form-templates?examId=${encodeURIComponent(examId)}`
  : '/form-templates'

// After:
const url = `/exams/${examId}/form-templates`
```

同步更新 `useCreateFormTemplate`、`useBatchUpdateFormTemplate`、`usePublishFormTemplate`。

- [ ] **Step 3: 验证编译和功能**

Run: `cd server && npx tsc --noEmit`
Run: `cd web && npx tsc --noEmit`

手动验证创建报名表单流程。

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "refactor: move form-template examId from query param to path param"
```

---

## 第三阶段：数据库优化

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 解决 N+1 查询和索引缺失问题，并行化跨租户操作

**Architecture:** 添加数据库索引 → 批量操作替代循环 → 并行化跨租户查询

---

### Task 14: 添加数据库索引

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Application 表添加索引**

```prisma
model Application {
  // ... 现有字段不变

  @@index([candidateId])
  @@index([examId])
  @@index([positionId])
  @@index([status])
}
```

- [ ] **Step 2: FileRecord 表添加索引**

```prisma
model FileRecord {
  // ... 现有字段不变

  @@index([applicationId])
  @@index([uploadedBy])
  @@index([status])
}
```

- [ ] **Step 3: Notification 表添加索引**

```prisma
model Notification {
  // ... 现有字段不变

  @@index([tenantId, createdAt])
}
```

- [ ] **Step 4: 生成迁移并应用**

```bash
cd server && npx prisma migrate dev --name add_performance_indexes
```

- [ ] **Step 5: 提交**

```bash
cd server && git add -A && git commit -m "perf(prisma): add performance indexes on Application, FileRecord, Notification"
```

---

### Task 15: 修复 SeatingService 中 N+1 票证更新

**Files:**
- Modify: `server/src/seating/seating.service.ts:161-185`

- [ ] **Step 1: 重构批量票证更新**

```typescript
// Before (循环逐个更新):
for (const assignment of assignments) {
  const venue = venueRoomStates.find((v) => v.id === assignment.venueId);
  const room = venue?.rooms.find((r) => r.id === assignment.roomId);
  await this.client.ticket.update({
    where: { applicationId: assignment.applicationId },
    data: { venueName: venue.name, roomName: room?.name, seatNo: assignment.seatNo },
  });
}

// After (批量更新):
// 1. 构建 Map: venueId → venue, roomId → room
const venueMap = new Map(venueRoomStates.map((v) => [v.id, v]));
const roomMap = new Map<string, { name: string; code: string }>();
for (const venue of venueRoomStates) {
  for (const room of venue.rooms) {
    roomMap.set(room.id, room);
  }
}

// 2. 批量 update（使用 $transaction 批量执行）
const updates = assignments.map((assignment) => {
  const venue = venueMap.get(assignment.venueId);
  const room = roomMap.get(assignment.roomId || '');
  return this.client.ticket.update({
    where: { applicationId: assignment.applicationId },
    data: {
      venueName: venue?.name,
      roomName: room?.name,
      seatNo: assignment.seatNo,
    },
  });
});

await this.client.$transaction(updates);
```

- [ ] **Step 2: 验证测试**

Run: `cd server && npm test -- seating.service.spec.ts`
Expected: 测试通过

- [ ] **Step 3: 提交**

```bash
cd server && git add -A && git commit -m "perf(server): batch ticket updates in seat allocation"
```

---

### Task 16: 修复 ScoreService 批量操作

**Files:**
- Modify: `server/src/exam/score.service.ts:159-205`
- Modify: `server/src/exam/score.service.ts:274-315`

- [ ] **Step 1: 重构 batchImportScores 为真批量操作**

```typescript
async batchImportScores(examId: string, scores: ImportScoreDto[]) {
  // 使用 createMany 替代循环 create
  const createData = scores.map((s) => ({
    examId,
    applicationId: s.applicationId,
    subjectId: s.subjectId,
    score: s.score,
    isAbsent: s.isAbsent || false,
    remarks: s.remarks || null,
  }));

  // 先删除旧成绩，再批量插入
  await this.client.$transaction(async (tx) => {
    await tx.examScore.deleteMany({
      where: {
        examId,
        applicationId: { in: scores.map((s) => s.applicationId) },
        subjectId: { in: [...new Set(scores.map((s) => s.subjectId))] },
      },
    });
    await tx.examScore.createMany({ data: createData });
  });
}
```

- [ ] **Step 2: 重构 batchCalculateEligibility 为批量操作**

```typescript
async batchCalculateEligibility(examId: string) {
  const applications = await this.client.application.findMany({
    where: { examId },
    include: { examScores: true },
  });

  // 批量更新（使用 $transaction 或 createMany）
  const updates = applications
    .filter((app) => app.examScores.length > 0)
    .map((app) => {
      const allPassed = app.examScores.every(
        (s) => s.score >= app.position.passingScore,
      );
      return this.client.application.update({
        where: { id: app.id },
        data: { status: allPassed ? ApplicationStatus.APPROVED : ApplicationStatus.PRIMARY_REJECTED },
      });
    });

  await this.client.$transaction(updates);
}
```

- [ ] **Step 3: 验证测试**

Run: `cd server && npm test -- score.service.spec.ts`
Expected: 测试通过

- [ ] **Step 4: 提交**

```bash
cd server && git add -A && git commit -m "perf(server): batch operations in score service"
```

---

### Task 17: 并行化跨租户查询

**Files:**
- Modify: `server/src/exam/exam.service.ts:254-289`
- Modify: `server/src/statistics/statistics.service.ts:234-244`

- [ ] **Step 1: findOpenPublicExams 并行化**

```typescript
// Before: for (const tenant of tenants) { await query(tenant) }
// After: Promise.allSettled 并行查询

async findOpenPublicExams() {
  const tenants = await this.prisma.tenant.findMany({ where: { status: 'ACTIVE' } });

  const results = await Promise.allSettled(
    tenants.map((tenant) =>
      this.prisma.runInTenantContext(tenant.schemaName, async () => {
        const exams = await this.client.exam.findMany({
          where: { status: ExamStatus.OPEN },
          include: { positions: true },
        });
        return { tenant, exams };
      }),
    ),
  );

  const openExams: any[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      for (const exam of result.value.exams) {
        openExams.push({
          ...exam,
          tenantId: result.value.tenant.id,
          tenantName: result.value.tenant.name,
        });
      }
    }
  }
  return openExams;
}
```

- [ ] **Step 2: getPlatformStatistics 并行化**

同样使用 `Promise.allSettled` 替代串行 `for` 循环。

- [ ] **Step 3: 验证编译**

Run: `cd server && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: 删除过时 schema 文件**

```bash
rm server/prisma/db_current_schema.prisma
```

- [ ] **Step 5: 提交**

```bash
cd server && git add -A && git commit -m "perf(server): parallelize cross-tenant queries"
```

---

### Task 18: 第三阶段验证

- [ ] **Step 1: 后端全面检查**

```bash
cd server && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 2: 迁移状态检查**

```bash
cd server && npx prisma migrate status
```
Expected: 所有迁移已应用

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "chore: phase 3 verification"
```

---

## 第四阶段：测试补全 & 收尾

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为核心模块建立测试基础，清理遗留代码

**Tech Stack:** Jest + Supertest (后端), Vitest + Testing Library (前端)

---

### Task 19: SeatingService 单元测试

**Files:**
- Create: `server/src/seating/seating.service.spec.ts`

- [ ] **Step 1: 编写 allocate 测试**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SeatingService } from './seating.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SeatingService', () => {
  let service: SeatingService;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      exam: {
        findUnique: jest.fn(),
      },
      venue: {
        findMany: jest.fn(),
      },
      application: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      seatAssignment: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      ticket: {
        update: jest.fn(),
      },
      reviewTask: {
        updateMany: jest.fn(),
      },
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeatingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SeatingService>(SeatingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('allocate', () => {
    it('should skip if no venues exist', async () => {
      mockPrisma.client.venue.findMany.mockResolvedValue([]);
      const result = await service.allocate('exam-1', { strategy: 'RANDOM' }, 'user-1');
      expect(result.totalAssigned).toBe(0);
    });

    it('should skip if no approved applications exist', async () => {
      mockPrisma.client.venue.findMany.mockResolvedValue([{ id: 'venue-1', capacity: 50 }]);
      mockPrisma.client.application.findMany.mockResolvedValue([]);
      const result = await service.allocate('exam-1', { strategy: 'RANDOM' }, 'user-1');
      expect(result.totalAssigned).toBe(0);
    });

    it('should assign seats for approved applications', async () => {
      mockPrisma.client.venue.findMany.mockResolvedValue([{
        id: 'venue-1',
        capacity: 50,
        rooms: [{ id: 'room-1', name: '101', capacity: 30, code: '101' }],
      }]);
      mockPrisma.client.application.findMany.mockResolvedValue([
        { id: 'app-1', candidateId: 'user-1', positionId: 'pos-1', examId: 'exam-1' },
        { id: 'app-2', candidateId: 'user-2', positionId: 'pos-1', examId: 'exam-1' },
      ]);
      mockPrisma.client.application.count.mockResolvedValue(2);
      mockPrisma.client.seatAssignment.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.client.ticket.update.mockResolvedValue({});

      const result = await service.allocate('exam-1', { strategy: 'RANDOM' }, 'user-1');

      expect(result.totalAssigned).toBe(2);
      expect(mockPrisma.client.seatAssignment.createMany).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: 运行测试**

Run: `cd server && npm test -- seating.service.spec.ts`
Expected: 4 个测试全部通过

- [ ] **Step 3: 提交**

```bash
cd server && git add src/seating/seating.service.spec.ts && git commit -m "test(server): add SeatingService unit tests"
```

---

### Task 20: ReviewService 和 TicketService 测试

**Files:**
- Create: `server/src/review/review.service.spec.ts`
- Create: `server/src/ticket/ticket.service.spec.ts`

- [ ] **Step 1: 编写 ReviewService 测试**

测试用例：
- `pullNext()` - 从队列拉取任务
- `recordDecision()` - 记录审核决定
- 边界情况：空队列、任务已锁

- [ ] **Step 2: 编写 TicketService 测试**

测试用例：
- `generateTicket()` - 生成单个准考证
- `batchGenerate()` - 批量生成
- 边界情况：申请不存在、已生成过

- [ ] **Step 3: 运行测试**

Run: `cd server && npm test -- review.service.spec.ts ticket.service.spec.ts`
Expected: 所有测试通过

- [ ] **Step 4: 提交**

```bash
cd server && git add -A && git commit -m "test(server): add ReviewService and TicketService unit tests"
```

---

### Task 21: 死代码清理

**Files:**
- Delete: `web/src/lib/tenant-api.ts`
- Modify: `web/src/lib/api-hooks.ts:1811-1911`
- Modify: 9 个 Tenant*Page 文件

- [ ] **Step 1: 删除重复的 tenant-api.ts**

```bash
rm web/src/lib/tenant-api.ts
```

- [ ] **Step 2: 清理 api-hooks.ts 中的被注释代码**

删除 line 1811-1820 的 `useTicketByApplication` 和 line 1897-1911 的 `useGenerateTicket` 注释块。

- [ ] **Step 3: 提取 TenantRedirect 工厂函数**

```typescript
// web/src/components/auth/createTenantRedirect.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTenant } from '@/hooks/useTenant'
import { Spinner } from '@/components/ui/loading'

export function createTenantRedirectPage(targetPath: string) {
  return function TenantRedirectPage() {
    const router = useRouter()
    const { tenant, isLoading } = useTenant()

    useEffect(() => {
      if (!isLoading && tenant) {
        router.replace(targetPath)
      }
    }, [isLoading, tenant, router])

    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }
}
```

- [ ] **Step 4: 用工厂函数替换 9 个壳页面**

```typescript
// 替换前: web/src/app/[tenantSlug]/candidate/applications/page.tsx (57行)
// 替换后:
import { createTenantRedirectPage } from '@/components/auth/createTenantRedirect'

export default createTenantRedirectPage('/candidate/applications')
```

- [ ] **Step 5: 验证编译**

Run: `cd web && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 6: 提交**

```bash
cd web && git add -A && git commit -m "refactor(web): remove dead code and extract tenant redirect factory"
```

---

### Task 22: 配置外部化

**Files:**
- Modify: `server/src/scheduler/file-cleanup.service.ts`
- Modify: `server/src/main.ts`
- Modify: `server/src/payment/payment.service.ts`
- Modify: `web/src/middleware.ts`

- [ ] **Step 1: 前端 middleware 配置外部化**

```typescript
// web/src/middleware.ts
// Before:
const BACKEND_URL = 'http://127.0.0.1:8081';

// After:
const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8081';
```

- [ ] **Step 2: 后端 MinIO 凭据外部化**

```typescript
// server/src/scheduler/file-cleanup.service.ts
// Before:
const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
});

// After:
const minioClient = new Minio.Client({
  endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
  port: parseInt(this.configService.get('MINIO_PORT', '9000')),
  accessKey: this.configService.getOrThrow('MINIO_ACCESS_KEY'),
  secretKey: this.configService.getOrThrow('MINIO_SECRET_KEY'),
});
```

（需要注入 `ConfigService` 到 `FileCleanupService`）

- [ ] **Step 3: 前端硬编码 URL 外部化**

```typescript
// web/src/lib/api/client-generated.ts
// Before:
const BASE_URL = 'http://localhost:8081/api/v1';

// After:
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081/api/v1';
```

- [ ] **Step 4: 验证编译**

Run: `cd server && npx tsc --noEmit`
Run: `cd web && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "refactor: externalize hardcoded URLs and credentials to env vars"
```

---

### Task 23: 第四阶段验证与最终检查

- [ ] **Step 1: 全栈测试**

```bash
cd server && npm test && npm run lint
cd web && npx tsc --noEmit && npm run lint && npx vitest run
```

- [ ] **Step 2: 端到端冒烟测试**

手动验证核心流程：
1. 登录 → 租户选择
2. 考试管理：创建 → 岗位/科目 → 报名表单 → 考场/教室
3. 坐位分配 → 成绩管理
4. 统计页面有数据

- [ ] **Step 3: 提交最终结果**

```bash
git add -A && git commit -m "chore: final phase 4 verification and cleanup"
```
