# Codebase Structure

**Analysis Date:** 2026-03-04

## Directory Layout

```
duanruo-exam-system2/
├── server/                         # NestJS backend (standalone npm project)
│   ├── src/
│   │   ├── main.ts                 # Application entry point, app initialization
│   │   ├── app.module.ts           # Root module with all feature modules
│   │   ├── app.controller.ts       # Root controller
│   │   ├── prisma/                 # Database layer
│   │   │   ├── prisma.service.ts   # Tenant-aware Prisma client with AsyncLocalStorage
│   │   │   └── schema.prisma       # Database models (public + tenant tables)
│   │   ├── tenant/                 # Multi-tenancy infrastructure
│   │   │   ├── tenant.middleware.ts # Extract tenant ID, set AsyncLocalStorage context
│   │   │   ├── tenant.service.ts   # Create tenants, PostgreSQL schemas, MinIO buckets
│   │   │   ├── tenant-schema-template.sql # SQL for initializing new tenant schema
│   │   │   └── tenant.controller.ts # Tenant CRUD endpoints
│   │   ├── auth/                   # Authentication & authorization
│   │   │   ├── jwt.strategy.ts     # Passport JWT extraction & validation
│   │   │   ├── jwt-auth.guard.ts   # Guard for @UseGuards(JwtAuthGuard)
│   │   │   ├── tenant.guard.ts     # Validates tenant ID matches JWT
│   │   │   ├── permissions.guard.ts # Role/permission enforcement
│   │   │   ├── permissions.decorator.ts # @Permissions(...) decorator
│   │   │   ├── auth.service.ts     # Login, register, JWT generation
│   │   │   └── auth.controller.ts  # POST /auth/login, /register
│   │   ├── user/                   # User management
│   │   │   ├── user.service.ts     # User profile operations
│   │   │   ├── user.controller.ts  # User endpoints
│   │   │   └── dto/                # UserUpdateDTO, etc.
│   │   ├── exam/                   # Exam management
│   │   │   ├── exam.service.ts     # Exam CRUD, status transitions
│   │   │   ├── exam.controller.ts  # Exam endpoints
│   │   │   ├── published-exam.controller.ts # Public exam listing (no auth required)
│   │   │   ├── position.service.ts # Position (job position) management
│   │   │   ├── score.service.ts    # Score recording & statistics
│   │   │   ├── form-template.controller.ts # Application form templates
│   │   │   └── dto/                # ExamCreateRequest, PositionDTO, etc.
│   │   ├── application/            # Application (registration) management
│   │   │   ├── application.service.ts # Application submit, list, detail
│   │   │   ├── application.controller.ts # Application endpoints
│   │   │   ├── commands/           # CQRS-style command handlers (if used)
│   │   │   ├── queries/            # Query handlers
│   │   │   └── dto/                # ApplicationSubmitRequest, etc.
│   │   ├── review/                 # Multi-stage review workflow
│   │   │   ├── review.service.ts   # Pull task, record decision, history
│   │   │   ├── auto-review.service.ts # Auto-approve/reject based on rules
│   │   │   ├── review.controller.ts # Review queue and task endpoints
│   │   │   └── dto/                # ReviewStageDTO, DecisionTaskRequest, etc.
│   │   ├── payment/                # Payment management
│   │   │   ├── payment.service.ts  # Order creation, status tracking
│   │   │   ├── payment.controller.ts # Payment endpoints
│   │   │   ├── mock-gateway.service.ts # Dev mock payment gateway
│   │   │   ├── mock-gateway.controller.ts # Dev payment callback simulator
│   │   │   └── dto/                # PaymentOrderDTO, etc.
│   │   ├── ticket/                 # Admission ticket generation
│   │   │   ├── ticket.service.ts   # Generate tickets with numbering rules
│   │   │   ├── ticket.controller.ts # Ticket endpoints
│   │   │   └── dto/                # TicketGenerateRequest, etc.
│   │   ├── seating/                # Venue & seat allocation
│   │   │   ├── seating.service.ts  # Venue CRUD, seat map, allocation
│   │   │   ├── seating.controller.ts # Seating endpoints
│   │   │   └── dto/                # VenueCreateRequest, etc.
│   │   ├── file/                   # File upload/download via MinIO
│   │   │   ├── file.service.ts     # Upload, download, delete with MinIO
│   │   │   ├── file.controller.ts  # File endpoints
│   │   │   ├── file-validator.ts   # Validation for file types/sizes
│   │   │   └── dto/                # FileUploadDTO, etc.
│   │   ├── statistics/             # Reporting & analytics
│   │   │   ├── statistics.service.ts # Aggregate data, generate reports
│   │   │   ├── statistics.controller.ts # Analytics endpoints
│   │   │   └── dto/                # Statistical query DTOs
│   │   ├── super-admin/            # Platform-level administration
│   │   │   ├── super-admin.service.ts # Manage tenants, platform users
│   │   │   ├── super-admin.controller.ts # Platform admin endpoints
│   │   │   └── dto/                # CreateTenantDTO, CreateUserDTO, etc.
│   │   ├── scheduler/              # Cron-based scheduled tasks
│   │   │   ├── exam-scheduler.service.ts # Auto-transition exam statuses
│   │   │   ├── file-cleanup.service.ts # Delete expired files
│   │   │   └── scheduler.module.ts
│   │   ├── common/                 # Shared infrastructure
│   │   │   ├── filters/            # AllExceptionsFilter for centralized error handling
│   │   │   ├── interceptors/       # TransformInterceptor for response wrapping
│   │   │   ├── middleware/         # Custom middlewares
│   │   │   ├── pii/                # Personally identifiable information utilities
│   │   │   ├── security/           # Security utilities
│   │   │   ├── notification/       # Notification service (email, SMS, webhooks)
│   │   │   ├── utils/              # Helper functions
│   │   │   ├── dto/                # Common DTOs (ApiResult, PaginatedResponse, etc.)
│   │   │   └── common.module.ts
│   │   └── test/                   # Test utilities & fixtures
│   │       └── fixtures/           # Mock data for testing
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma schema (models for both public and tenant tables)
│   │   └── migrations/             # Database migrations
│   └── package.json                # Node dependencies
│
├── web/                            # Next.js 14 App Router frontend (standalone npm project)
│   ├── src/
│   │   ├── app/                    # Next.js App Router directory
│   │   │   ├── layout.tsx          # Root layout with QueryProvider, AuthProvider
│   │   │   ├── page.tsx            # Home page
│   │   │   ├── globals.css         # Global Tailwind styles
│   │   │   ├── (auth)/             # Public auth routes (route group)
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx    # Login form page
│   │   │   │   └── register/
│   │   │   │       └── page.tsx    # Registration form page
│   │   │   ├── [tenantSlug]/       # Dynamic tenant route group
│   │   │   │   ├── layout.tsx      # Tenant-scoped layout
│   │   │   │   ├── candidate/      # Candidate portal
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── exams/      # Browse available exams
│   │   │   │   │   ├── applications/ # View/manage applications
│   │   │   │   │   ├── payment/    # Payment page
│   │   │   │   │   ├── tickets/    # View admission tickets
│   │   │   │   │   ├── scores/     # View exam scores
│   │   │   │   │   └── notifications/ # Notification center
│   │   │   │   ├── reviewer/       # Reviewer portal
│   │   │   │   │   ├── queue/      # Task queue UI
│   │   │   │   │   ├── review/     # Review form for applications
│   │   │   │   │   ├── history/    # Past reviews
│   │   │   │   │   └── applications/ # Search/filter reviewed apps
│   │   │   │   ├── admin/          # Tenant admin dashboard
│   │   │   │   │   ├── exams/      # Exam management
│   │   │   │   │   ├── users/      # User management
│   │   │   │   │   ├── reviewers/  # Reviewer assignment
│   │   │   │   │   ├── venues/     # Venue/seat management
│   │   │   │   │   ├── scores/     # Score import/export
│   │   │   │   │   ├── settings/   # Tenant settings
│   │   │   │   │   └── analytics/  # Reporting & analytics
│   │   │   │   └── my-applications/ # Candidate cross-tenant apps
│   │   │   ├── super-admin/        # Platform admin dashboard
│   │   │   │   ├── tenants/        # Tenant management
│   │   │   │   ├── users/          # Platform user management
│   │   │   │   └── page.tsx        # Dashboard
│   │   │   ├── admin/              # Legacy admin routes (non-tenant-specific)
│   │   │   ├── candidate/          # Legacy candidate routes
│   │   │   ├── reviewer/           # Legacy reviewer routes
│   │   │   ├── api/                # Next.js API routes (route handlers)
│   │   │   │   └── session/        # GET /api/session (auth state endpoint)
│   │   │   └── unauthorized/       # Error page for insufficient permissions
│   │   ├── contexts/               # React Context providers
│   │   │   └── AuthContext.tsx     # Auth state (user, token, tenantRoles)
│   │   ├── components/             # Reusable React components
│   │   │   ├── ui/                 # shadcn/ui components (Button, Dialog, Table, etc.)
│   │   │   ├── layout/             # Layout components (Header, Sidebar, etc.)
│   │   │   ├── admin/              # Admin-specific components
│   │   │   ├── forms/              # Form components
│   │   │   ├── auth/               # Auth UI components
│   │   │   ├── payment/            # Payment flow components
│   │   │   ├── analytics/          # Analytics/chart components
│   │   │   ├── SeatMap.tsx         # Seat map visualization
│   │   │   └── ErrorBoundary.tsx
│   │   ├── lib/                    # Utility functions & hooks
│   │   │   ├── api.ts              # Axios API client with auto-auth headers
│   │   │   ├── api-hooks.ts        # React Query hooks for all endpoints
│   │   │   ├── schemas.ts          # Zod validation schemas
│   │   │   └── utils.ts            # Helper functions
│   │   ├── types/                  # TypeScript type definitions
│   │   │   ├── auth.ts             # Auth-related types
│   │   │   ├── exam.ts             # Exam types
│   │   │   ├── application.ts      # Application types
│   │   │   └── [other domain types]
│   │   ├── middleware.ts           # Next.js middleware for route protection & role checking
│   │   └── public/                 # Static assets
│   ├── next.config.js              # Next.js config with API rewrites to backend
│   ├── tsconfig.json               # TypeScript config with @ path alias
│   ├── package.json
│   ├── tests/                      # BDD & E2E tests
│   │   ├── bdd/
│   │   │   ├── features/           # Cucumber feature files
│   │   │   ├── step-definitions/   # BDD step implementations
│   │   │   └── support/            # Test setup & fixtures
│   │   └── e2e/                    # Playwright E2E tests
│   └── openapi/                    # Generated OpenAPI client types
│
├── api-contracts/                  # Shared OpenAPI specifications
│   └── [OpenAPI spec files]
│
├── scripts/                        # Utility scripts
│   ├── [PowerShell/SQL migration scripts]
│   └── [Tenant setup scripts]
│
├── docs/                           # Documentation
│   ├── [Architecture docs]
│   ├── [Test reports]
│   └── [Fix summaries]
│
├── CLAUDE.md                       # Project guidelines for Claude
└── .env.example                    # Example environment variables
```

## Directory Purposes

**Backend Modules (`server/src/`):**

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `prisma/` | ORM & schema | `prisma.service.ts` (tenant-aware client), `schema.prisma` (models) |
| `tenant/` | Multi-tenancy | `tenant.middleware.ts` (context), `tenant.service.ts` (setup), `tenant-schema-template.sql` |
| `auth/` | Security | `jwt.strategy.ts`, `jwt-auth.guard.ts`, `auth.service.ts` |
| `exam/` | Exam operations | `exam.service.ts`, `exam.controller.ts`, `score.service.ts` |
| `application/` | Registration workflow | `application.service.ts`, `application.controller.ts` |
| `review/` | Multi-stage review | `review.service.ts`, `auto-review.service.ts` |
| `payment/` | Payments | `payment.service.ts`, `mock-gateway.service.ts` (dev) |
| `ticket/` | Tickets | `ticket.service.ts` with numbering rules |
| `seating/` | Venues & seats | `seating.service.ts` with allocation logic |
| `file/` | File storage | `file.service.ts` (MinIO), `file-validator.ts` |
| `statistics/` | Analytics | `statistics.service.ts` (reports & aggregates) |
| `super-admin/` | Platform admin | `super-admin.service.ts` (tenant management) |
| `scheduler/` | Cron tasks | `exam-scheduler.service.ts`, `file-cleanup.service.ts` |
| `common/` | Shared infrastructure | Filters, interceptors, middleware, utilities |

**Frontend Routes (`web/src/app/`):**

| Route | Purpose | Layout | Auth Required |
|-------|---------|--------|--|
| `/login`, `/register` | Auth pages | Minimal | No |
| `/` | Home/landing | Root | No |
| `/[tenantSlug]/candidate/**` | Candidate portal | Tenant layout | Yes (CANDIDATE) |
| `/[tenantSlug]/reviewer/**` | Reviewer portal | Tenant layout | Yes (REVIEWER roles) |
| `/[tenantSlug]/admin/**` | Tenant admin | Tenant layout | Yes (ADMIN roles) |
| `/super-admin/**` | Platform admin | Root | Yes (SUPER_ADMIN) |

## Key File Locations

**Entry Points:**

| File | Purpose |
|------|---------|
| `server/src/main.ts` | Backend initialization, port 8081 |
| `web/src/app/layout.tsx` | Frontend root layout |
| `web/src/middleware.ts` | Route protection & role enforcement |

**Configuration:**

| File | Purpose |
|------|---------|
| `server/prisma/schema.prisma` | Database schema |
| `web/next.config.js` | Next.js config with API rewrites |
| `server/.env` | Backend secrets (DATABASE_URL, JWT_SECRET, MinIO, etc.) |
| `web/.env.local` | Frontend config (NEXT_PUBLIC_API_URL, etc.) |

**Core Logic:**

| File | Purpose |
|------|---------|
| `server/src/prisma/prisma.service.ts` | Tenant-aware database client |
| `server/src/tenant/tenant.middleware.ts` | Tenant context injection |
| `server/src/auth/jwt.strategy.ts` | JWT validation |
| `web/src/contexts/AuthContext.tsx` | Frontend auth state |
| `web/src/lib/api.ts` | API client with auto-headers |
| `web/src/lib/api-hooks.ts` | React Query hooks |

**Testing:**

| Directory | Purpose |
|-----------|---------|
| `server/src/**/*.spec.ts` | Unit tests co-located with source |
| `web/tests/bdd/` | BDD feature tests (Cucumber) |
| `web/tests/e2e/` | Playwright E2E tests |

## Naming Conventions

**Files:**

| Pattern | Example | Usage |
|---------|---------|-------|
| `[feature].service.ts` | `exam.service.ts` | NestJS service class |
| `[feature].controller.ts` | `exam.controller.ts` | HTTP controller |
| `[feature].module.ts` | `exam.module.ts` | NestJS module |
| `[feature].dto.ts` | `exam.dto.ts` | Request/response DTOs |
| `[feature].guard.ts` | `jwt-auth.guard.ts` | NestJS guard |
| `[feature].interceptor.ts` | `transform.interceptor.ts` | NestJS interceptor |
| `[feature].middleware.ts` | `tenant.middleware.ts` | Express middleware |
| `page.tsx` | `exams/page.tsx` | Next.js page component |
| `layout.tsx` | `[tenantSlug]/layout.tsx` | Next.js layout |
| `route.ts` | `api/session/route.ts` | Next.js API route |
| `[name].spec.ts` | `auth.service.spec.ts` | Jest test file |

**Directories:**

| Pattern | Purpose | Examples |
|---------|---------|----------|
| `[feature]/` | Feature module | `exam/`, `application/`, `auth/` |
| `[role]/` | Role-based portal | `candidate/`, `reviewer/`, `admin/` |
| `[tenantSlug]/` | Dynamic tenant route | `[tenantSlug]/` (bracket notation) |
| `dto/` | Data transfer objects | `exam/dto/` |
| `commands/` | Command handlers (optional CQRS) | `application/commands/` |
| `queries/` | Query handlers (optional CQRS) | `application/queries/` |
| `ui/` | UI components | `components/ui/` |
| `lib/` | Utilities & hooks | `lib/api.ts`, `lib/api-hooks.ts` |
| `contexts/` | React Context providers | `contexts/AuthContext.tsx` |

**Functions & Variables:**

- **Backend:** camelCase (e.g., `getUserById()`, `applicationService`)
- **Frontend:** camelCase for functions/hooks (e.g., `useExamList()`, `formatDate()`)
- **React Components:** PascalCase (e.g., `ExamCard`, `ApplicationForm`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `LOCK_TTL_MINUTES = 10`)

## Where to Add New Code

**New Backend Feature:**
1. Create module directory: `server/src/[feature]/`
2. Add service: `server/src/[feature]/[feature].service.ts`
3. Add controller: `server/src/[feature]/[feature].controller.ts`
4. Add module: `server/src/[feature]/[feature].module.ts`
5. Add DTOs: `server/src/[feature]/dto/`
6. Import module in `server/src/app.module.ts`
7. Add tests: `server/src/[feature]/[feature].service.spec.ts`

**New Frontend Page/Route:**
1. For tenant-scoped: Create in `web/src/app/[tenantSlug]/[role]/[feature]/`
2. For public: Create in `web/src/app/[feature]/`
3. Add `page.tsx` or `layout.tsx` as needed
4. Middleware in `web/src/middleware.ts` automatically protects tenant routes
5. Add React Query hooks in `web/src/lib/api-hooks.ts` if backend API needed
6. Create components in `web/src/components/`

**New Utility/Helper:**
- Backend: `server/src/common/utils/[utility].ts`
- Frontend: `web/src/lib/[utility].ts` or `web/src/utils/[utility].ts`

**New Types/Interfaces:**
- Backend: Inline in `.dto.ts` files or `server/src/common/dto/`
- Frontend: Dedicated files in `web/src/types/[domain].ts`

## Special Directories

**`server/src/common/`:**
- Purpose: Shared infrastructure across all modules
- Generated: No
- Committed: Yes
- Contains: Filters, interceptors, middleware, DTOs, utilities, notification service

**`web/.next/`:**
- Purpose: Next.js build output
- Generated: Yes (created by `npm run build`)
- Committed: No (in `.gitignore`)
- Contains: Compiled pages, static optimization data

**`web/openapi/`:**
- Purpose: Generated OpenAPI types from backend spec
- Generated: Yes (by `npm run openapi:refresh`)
- Committed: No (generated automatically)
- Contains: Type-safe client SDK generated from OpenAPI spec

**`server/prisma/migrations/`:**
- Purpose: Database migration history
- Generated: No (manual via Prisma CLI)
- Committed: Yes
- Usage: `npx prisma migrate deploy` in production

**`web/tests/`:**
- Purpose: BDD and E2E tests
- Generated: No (manually written)
- Committed: Yes
- Substructure:
  - `bdd/features/` — Cucumber feature files (.feature)
  - `bdd/step-definitions/` — Step implementations (.ts)
  - `bdd/support/` — Test hooks & fixtures

**`server/src/test/fixtures/`:**
- Purpose: Mock data for unit tests
- Generated: No
- Committed: Yes
- Usage: Import in `.spec.ts` files for test data

---

*Structure analysis: 2026-03-04*
