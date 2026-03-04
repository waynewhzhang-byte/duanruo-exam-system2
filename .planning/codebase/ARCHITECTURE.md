# Architecture

**Analysis Date:** 2026-03-04

## Pattern Overview

**Overall:** Multi-layer, multi-tenant SaaS with schema-per-tenant PostgreSQL isolation and modular NestJS backend paired with Next.js 14 App Router frontend.

**Key Characteristics:**
- Schema-per-tenant architecture for complete data isolation in PostgreSQL
- Modular NestJS services organized by business domain
- JWT-based authentication with role and permission guards
- AsyncLocalStorage for tenant context propagation
- React Query for server state management on frontend
- Next.js App Router with middleware-enforced role-based access control

## Layers

**Presentation (Frontend):**
- Purpose: User-facing Next.js 14 App Router application with role-based views
- Location: `web/src/app/`
- Contains: Page components, layouts, API route handlers
- Depends on: Authentication context, React Query hooks, shadcn/ui components
- Used by: Browser clients across candidate, reviewer, and admin portals

**API Gateway / Middleware Layer (Backend):**
- Purpose: Request validation, tenant context extraction, CORS, response formatting
- Location: `server/src/main.ts`, `server/src/app.module.ts`, `server/src/tenant/tenant.middleware.ts`, `server/src/common/`
- Contains: Global pipes (validation), interceptors (response transform), filters (error handling), middlewares (tenant routing)
- Depends on: Express, NestJS core, configuration
- Used by: All requests to backend

**Service/Business Logic Layer:**
- Purpose: Implement domain-specific operations and workflows
- Location: `server/src/*/` modules (exam, application, review, payment, ticket, seating, statistics, etc.)
- Contains: Service classes with domain methods, controllers mapping HTTP to service calls
- Depends on: Prisma client, other services, external APIs (MinIO, payment gateways)
- Used by: Controllers, scheduled tasks, event handlers

**Data Access Layer:**
- Purpose: Manage database queries and schema switching for multi-tenancy
- Location: `server/src/prisma/prisma.service.ts`
- Contains: Extended Prisma client with AsyncLocalStorage-based schema switching
- Depends on: Prisma client, pg adapter, PostgreSQL
- Used by: All services for database operations

**Authentication & Authorization Layer:**
- Purpose: JWT validation, role checking, permission enforcement
- Location: `server/src/auth/`
- Contains: JWT strategy, guards (JwtAuthGuard, TenantGuard, PermissionsGuard), decorators
- Depends on: Passport.js, JWT
- Used by: Controllers via `@UseGuards()` decorator

**Frontend State Management:**
- Purpose: Session management, authentication state, server state caching
- Location: `web/src/contexts/AuthContext.tsx`, `web/src/lib/api-hooks.ts`
- Contains: Auth context provider, React Query hooks for API calls
- Depends on: React Query, Axios, browser cookies/storage
- Used by: Page components and layouts

## Data Flow

**Registration Lifecycle (Example: Multi-Step Application):**

1. **Application Submission (Candidate)**
   - Frontend: Candidate fills form → POST `/api/v1/applications/submit` with exam/position/payload
   - Backend Controller: `application.controller.ts` receives, extracts tenant from header
   - Service: `application.service.submit()` → Validates exam registration window → Creates/updates application record in tenant schema via `prisma.client` (with `SET LOCAL search_path`)
   - Auto-review trigger: `triggerAutoReview()` spawns async auto-review logic
   - Response: Transform interceptor wraps response as `{ success: true, data: {...}, timestamp }`

2. **Review Workflow (Reviewer Portal)**
   - Frontend: Reviewer visits `/[tenantSlug]/reviewer/queue` → React Query fetches pending tasks
   - Backend: `review.service.pullNext()` finds unreviewed applications from review_task queue
   - Task Lock: 10-minute lock on task to prevent concurrent reviews
   - Decision: `decisionTask()` marks application status as APPROVED/REJECTED, creates review_history record
   - Notification: Optional async notification sent to candidate
   - Status: Application transitions SUBMITTED → PRIMARY_REVIEW → SECONDARY_REVIEW → APPROVED/REJECTED

3. **Payment Flow**
   - Frontend: After approval, payment page displays fee (if required)
   - Backend: `payment.service.createOrder()` creates order record
   - Mock Gateway: Dev environment uses `mock-gateway.controller.ts` for testing
   - Payment callback: Updates order status, triggers ticket generation
   - State Management: Frontend refetches application status via React Query query invalidation

4. **Ticket & Seating**
   - Trigger: After payment or approval (exam-specific rules)
   - Service: `ticket.service.generateTicket()` creates admission ticket with configurable numbering
   - Seating: `seating.service.allocateSeats()` assigns venue/room based on seat map and allocation rules
   - Frontend: Candidate views ticket with exam location details

**State Management:**
- **Server State:** React Query caches API responses with automatic invalidation on mutations
- **Auth State:** AuthContext holds user, token, roles; persisted in cookies and localStorage
- **Tenant Context (Backend):** TenantMiddleware extracts tenant ID from headers → PrismaService.runInTenantContext() → all DB queries execute with correct `search_path`

## Key Abstractions

**Tenant Context:**
- Purpose: Isolate all tenant-scoped data and operations
- Examples: `server/src/tenant/tenant.middleware.ts`, `server/src/prisma/prisma.service.ts`
- Pattern: AsyncLocalStorage-based context injection; every request sets schema via `SET LOCAL search_path TO "tenant_xxx", public`

**Service Patterns:**
- Purpose: Encapsulate domain logic separate from HTTP concerns
- Examples: `server/src/exam/exam.service.ts`, `server/src/application/application.service.ts`, `server/src/review/review.service.ts`
- Pattern: Injected dependencies (Prisma, other services), private `get client()` getter for tenant-aware queries, explicit transaction handling

**React Query Hooks:**
- Purpose: Declarative server state fetching with caching and background refetch
- Examples: `web/src/lib/api-hooks.ts` exports custom hooks like `useExamList()`, `useApplicationDetail()`
- Pattern: TanStack React Query with automatic error handling and loading states

**API Response Wrapper:**
- Purpose: Consistent success/error response format
- Examples: `server/src/common/interceptors/transform.interceptor.ts` wraps all responses
- Pattern: `{ success: true, data: T, timestamp }` for success; error filter converts to `{ success: false, error: { code, message, details }, timestamp, path }`

**Role-Based Guards (Backend):**
- Purpose: Enforce authorization at controller method level
- Examples: `@Permissions('exam:view')` decorators on methods
- Pattern: PermissionsGuard extracts roles/permissions from JWT payload and compares against method metadata

**Role-Based Routing (Frontend):**
- Purpose: Redirect unauthenticated or unauthorized users
- Examples: `web/src/middleware.ts` checks user roles before allowing access to `/candidate`, `/reviewer`, `/admin`
- Pattern: NextRequest middleware extracts token/user-info from cookies → validates roles → blocks or allows

## Entry Points

**Backend:**
- Location: `server/src/main.ts`
- Triggers: npm run dev (NestFactory.create) or Node.js process start
- Responsibilities: Create NestJS app, register global pipes/interceptors/filters, enable CORS, start Swagger docs, listen on port 8081

**Frontend (Root Layout):**
- Location: `web/src/app/layout.tsx`
- Triggers: Next.js app initialization
- Responsibilities: Wrap app with QueryProvider (React Query) and AuthProvider (session management), include Toaster for notifications

**Frontend Middleware:**
- Location: `web/src/middleware.ts`
- Triggers: Every request to protected routes
- Responsibilities: Extract tenant slug from URL → validate auth token → check role-based access → redirect to appropriate dashboard or login

**Backend Controllers:**
- Examples: `server/src/exam/exam.controller.ts`, `server/src/application/application.controller.ts`
- Pattern: `@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)` at class level; `@Permissions(...)` at method level

## Error Handling

**Strategy:** Centralized exception filtering with consistent response format across backend; try-catch in services with specific exception types (NotFoundException, BadRequestException, etc.).

**Patterns:**

Backend error flow:
```
Controller throws HttpException
→ AllExceptionsFilter catches
→ Maps to ErrorResponse { success: false, error: { code, message, details }, timestamp, path }
```

Example from `server/src/common/filters/all-exceptions.filter.ts`:
- HttpException → Extract status and message → Map to error code (BAD_REQUEST, UNAUTHORIZED, etc.)
- Other Error instances → 500 INTERNAL_ERROR with logged stack trace
- Unknown → 500 UNKNOWN_ERROR

Frontend error handling:
```
React Query mutation/query errors
→ Caught in useMutation/useQuery error callback
→ Display toast notification or error message
```

## Cross-Cutting Concerns

**Logging:** NestJS Logger injected in services; `console.error()` in filters for unexpected exceptions. No centralized log aggregation configured.

**Validation:** NestJS ValidationPipe with DTO classes using `class-validator` decorators; frontend uses Zod for form validation.

**Authentication:** Passport JWT strategy extracts Bearer token from Authorization header; JwtAuthGuard blocks requests without valid token; TenantGuard verifies tenant ID matches JWT's tenantId.

**Tenant Isolation:** TenantMiddleware → AsyncLocalStorage context → PrismaService extends queries with `SET LOCAL search_path TO "tenant_schema", public` ensuring no cross-tenant data leaks.

**File Storage:** MinIO S3-compatible object storage; tenant-isolated buckets created on tenant setup. `file.service.ts` manages uploads/downloads with presigned URLs. Cleanup scheduled via `scheduler/file-cleanup.service.ts`.

**Notifications:** `common/notification/notification.service.ts` handles async notifications (email, SMS, webhooks). Currently integrated with review decision and payment events.

---

*Architecture analysis: 2026-03-04*
