# Coding Conventions

**Analysis Date:** 2026-03-04

## Naming Patterns

**Files:**
- Services: `{entity}.service.ts` (e.g., `exam.service.ts`, `user.service.ts`)
- Controllers: `{entity}.controller.ts` (e.g., `exam.controller.ts`)
- DTOs: `{entity}.dto.ts` (e.g., `exam.dto.ts`)
- Modules: `{entity}.module.ts` (e.g., `exam.module.ts`)
- Middleware: `{entity}.middleware.ts`
- Specs: `{entity}.spec.ts` (co-located with source)
- React components: PascalCase (e.g., `ExamBasicInfo.tsx`)
- Frontend hooks: `use{Entity}` (e.g., `useUpdateExam`, `useTenant`)
- Frontend type definitions: `{entity}.ts` in `src/types/` directory

**Functions:**
- Services use camelCase: `findAll()`, `findById()`, `create()`, `update()`
- Async functions use full word, not abbreviations: `async findById()` not `async find()`
- Middleware function names follow pattern: `use{Name}` (implied from Express/NestJS)
- React component functions are PascalCase: `ExamBasicInfo()`, `AdminDashboard()`
- Hook functions: `use` prefix with PascalCase: `useUpdateExam()`, `useExamStats()`
- Private methods use underscore prefix: `_mapToResponse()`, `_validateInput()`

**Variables:**
- camelCase for all: `examId`, `isEditing`, `formData`, `currentUser`
- Boolean variables prefixed with: `is*`, `has*`, `can*` (e.g., `isEditing`, `hasPermission`, `canSubmit`)
- Constants use UPPER_SNAKE_CASE: `MAX_FILE_SIZE`, `LOCK_TTL_MINUTES`, `API_BASE`
- Unused parameters prefixed with underscore: `(_param: string)` allowed by ESLint rule

**Types:**
- Interfaces use PascalCase: `ExamResponse`, `JwtPayload`, `QueueTaskRaw`
- DTO Classes use PascalCase: `ExamCreateRequest`, `ExamUpdateRequest`
- Type aliases use PascalCase: `export type OverviewStats = z.infer<typeof OverviewStatsSchema>`
- Enums use PascalCase: `ReviewStage`, `ApplicationStatus`

## Code Style

**Formatting:**
- Tool: Prettier 3.4.2 (backend), Next.js ESLint (frontend)
- Single quotes: enabled (`singleQuote: true`)
- Trailing commas: all (`trailingComma: "all"`)
- Line endings: auto (`prettier/prettier: ["error", { endOfLine: "auto" }]`)

**Linting:**
Backend (`server/eslint.config.mjs`):
- ESLint with TypeScript support (typescript-eslint 8.20.0)
- Strict type checking enabled for safety
- Key rules:
  - `@typescript-eslint/no-explicit-any: 'error'` - Ban any types
  - `@typescript-eslint/no-unsafe-*: 'error'` - Strict safety on type operations
  - `@typescript-eslint/no-floating-promises: 'error'` - Catch promise violations
  - `@typescript-eslint/no-unused-vars` - Unused vars, allow `_` prefix
  - `prettier/prettier` - Format enforcement

Frontend (`web/.eslintrc.json`):
- Next.js core-web-vitals config
- Rule overrides:
  - `react/no-unescaped-entities: 'off'`
  - `react-hooks/exhaustive-deps: 'warn'` (not error)

**TypeScript:**
Backend (`server/tsconfig.json`):
- Target: ES2021
- Strict mode: disabled (but eslint enforces strict checking)
- Loose settings (skipLibCheck, noImplicitAny off) with strict ESLint rules

Frontend (`web/tsconfig.json`):
- Target: es5
- Strict mode: enabled (`"strict": true`)
- Path alias: `@/*` → `./src/*`

## Import Organization

**Order (Backend - NestJS):**
1. NestJS framework imports (`@nestjs/*`)
2. External library imports (`axios`, `uuid`, etc.)
3. Prisma imports (`@prisma/client`)
4. Local imports (relative `../` or absolute `./`)
5. Interfaces/types (inline or separate sections)

Example from `exam.service.ts`:
```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Exam } from '@prisma/client';
import {
  ExamCreateRequest,
  ExamUpdateRequest,
  ExamResponse,
} from './dto/exam.dto';
```

**Order (Frontend - Next.js/React):**
1. React imports (`import React from 'react'`, `'use client'` directive first)
2. External libraries (`axios`, `zod`, etc.)
3. shadcn/ui imports (`@/components/ui/*`)
4. Custom hooks (`@/hooks/*`, `@/lib/api-hooks`)
5. Contexts (`@/contexts/*`)
6. Local types and utilities
7. Icons (lucide-react, etc.)

Example from `ExamBasicInfo.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useUpdateExam, useUpdateExamAnnouncement } from '@/lib/api-hooks'
import { useTenant } from '@/hooks/useTenant'
import { CheckCircle, XCircle, Save, Wallet, Edit } from 'lucide-react'
```

## Error Handling

**Backend Strategy:**
- Use NestJS HttpException subclasses: `NotFoundException`, `BadRequestException`, `UnauthorizedException`, etc.
- Throw with descriptive messages: `throw new NotFoundException('Exam not found')`
- Services throw exceptions; controllers handle via guards and filters
- Global transform interceptor wraps responses in `{ success: true, data: T, timestamp: ISO8601 }` format

Example from `exam.service.ts`:
```typescript
async findById(id: string): Promise<ExamResponse> {
  const exam = await this.client.exam.findUnique({
    where: { id },
  });
  if (!exam) throw new NotFoundException('Exam not found');
  return this.mapToResponse(exam);
}
```

**Frontend Strategy:**
- API calls wrapped in try/catch blocks
- Error handling with `.catch()` on Promise chains or try/catch in async functions
- Toast notifications for user feedback: `toast.error(error?.message || 'Operation failed')`
- Store last error state for conditional rendering

Example from `world.ts` (BDD):
```typescript
try {
  const response = await axios.post(`${API_BASE}${path}`, body, {...});
  this.lastResponse = response.data;
  return response.data;
} catch (error: any) {
  if (error.code === 'ECONNREFUSED' || error.response?.status >= 500) {
    console.warn(`[Mock Mode] Backend unreachable...`);
    return this.handleMockResponse(path, 'POST', body);
  }
  this.lastError = error;
  throw error;
}
```

## Logging

**Framework:** NestJS Logger

**Patterns:**
- Initialize logger per service: `private readonly logger = new Logger(ReviewService.name);`
- Log significant operations: `this.logger.log('Operation description: ${details}')`
- Log warnings for degraded functionality: `this.logger.warn('Fallback behavior triggered')`
- Log errors on failures: `this.logger.error('Error description: ${error.message}')`
- No logging in guards/interceptors (handled by framework)
- BDD tests use `console.warn()` for mock mode notifications

Example from `mock-gateway.service.ts`:
```typescript
private readonly logger = new Logger(MockGatewayService.name);

async createOrder(...) {
  this.logger.log(`Mock order created: ${outTradeNo}, amount: ${amount}`);
}

async failPayment(...) {
  this.logger.warn(`Mock payment FAILED: ${outTradeNo}`);
}
```

## Comments

**When to Comment:**
- Complex business logic: explain the "why" not the "what"
- Transaction blocks: explain atomic operation requirements
- Workarounds: document why non-obvious approach was chosen
- Multi-step processes: brief description before key steps

**JSDoc/TSDoc:**
- Not consistently used in codebase; comments are inline only
- Interfaces and DTOs have no doc comments
- Services document complex methods with single-line comments

Example from `review.service.ts`:
```typescript
// Atomic transaction to find and claim the next available application
const result = await this.client.$transaction(async (tx) => {
  // 1. Double check for active tasks within the transaction
  const activeTasks = await tx.reviewTask.findMany({...});

  // 2. Find the first application that really doesn't have an active task
  const availableApp = applications.find(app => !activeApplicationIds.has(app.id));
```

## Function Design

**Size:**
- Services: typical 20-60 lines per method (finder/creator)
- Controllers: 10-20 lines (delegation to service + response mapping)
- React components: 50-150 lines with hooks/state
- No apparent line-count limits enforced

**Parameters:**
- Use request DTOs for multiple params: `create(request: ExamCreateRequest)` not `create(code, title, description, ...)`
- Pass userId/recorderId for audit: included as separate param
- Options pattern for query filters: `findAll(page = 0, size = 10, status?: string)`

**Return Values:**
- Services return Promise<T> for async operations
- Explicit response DTOs: `ExamResponse`, `ApplicationResponse`, not raw Prisma models
- Mappers for transformation: `mapToResponse(raw: Exam): ExamResponse`
- List endpoints return: `{ content: T[], total: number }`

## Module Design

**Exports:**
- Modules export services and controllers
- Services exported from module: allows injection in other modules
- Decorators on classes: `@Injectable()` for services, `@Controller()` for controllers
- Module registration: in `app.module.ts` imports list

**Barrel Files:**
- Not used; imports are direct from files
- DTOs imported directly: `from './dto/exam.dto'`
- No index.ts re-exports in feature directories

Example from `exam.module.ts`:
```typescript
@Module({
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
```

---

*Convention analysis: 2026-03-04*
