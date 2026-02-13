# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant online recruitment exam registration system (端若数智考盟). Manages the full lifecycle: exam publishing, candidate registration, document review, payment, admission ticket generation, and seating arrangement.

**Tech Stack**: NestJS 11 (backend) + Next.js 14 App Router (frontend) + Prisma 6 + PostgreSQL + MinIO + shadcn/ui

## Commands

### Backend (`server/`)
```bash
cd server
npm run dev              # Dev server with hot reload (port 8081)
npm run build            # Compile TypeScript
npm run start:prod       # Run compiled output
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting
npm run test             # Jest unit tests
npm run test:watch       # Jest watch mode
npm run test:cov         # Jest with coverage
npm run test:e2e         # E2E tests (jest-e2e.json)
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma db push       # Push schema changes to database
```

### Frontend (`web/`)
```bash
cd web
npm run dev              # Next.js dev server (port 3000)
npm run build            # Production build
npm run lint             # Next.js ESLint
npm run type-check       # TypeScript type check (tsc --noEmit)
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:bdd         # Cucumber BDD tests
npm run test:bdd:layer-N # Run specific BDD layer (0-7)
npm run openapi:refresh  # Re-export OpenAPI spec from backend + regenerate client
```

### Running Both
Backend runs on `http://localhost:8081/api/v1`. Frontend on `http://localhost:3000` and proxies `/api/v1/*` to the backend via Next.js rewrites (configured in `next.config.js`, controlled by `BACKEND_ORIGIN` env var).

## Architecture

### Repository Structure
```
server/          # NestJS backend (standalone npm project)
web/             # Next.js frontend (standalone npm project)
scripts/         # PowerShell/SQL utility scripts for DB migrations, tenant setup
api-contracts/   # OpenAPI specifications (shared contract)
docs/            # Architecture docs, test reports, fix summaries
```
Not a formal monorepo—each project has its own `package.json`. No shared TypeScript packages.

### Multi-Tenancy (Schema-per-Tenant)

The core architectural pattern. PostgreSQL schema isolation:
- **`public` schema**: Platform-wide data (`users`, `tenants`, `user_tenant_roles`)
- **`tenant_{code}` schema**: Per-tenant business data (`exams`, `applications`, `reviews`, `tickets`, `venues`, etc.)

**Request flow**: `TenantMiddleware` → extract `X-Tenant-ID`/`X-Tenant-Slug` header → lookup `tenants.schema_name` → `AsyncLocalStorage` context → `PrismaService.client` executes `SET LOCAL search_path TO "tenant_xxx", public` per query.

Key files:
- `server/src/tenant/tenant.middleware.ts` — Extracts tenant from headers, sets ALS context
- `server/src/prisma/prisma.service.ts` — `AsyncLocalStorage`-based schema switching via `$extends`
- `server/src/tenant/tenant.service.ts` — Creates tenant record + PostgreSQL schema + MinIO bucket
- `server/src/tenant/tenant-schema-template.sql` — SQL template for initializing a new tenant schema

**Important**: `TenantMiddleware` is applied to all routes _except_ `/api/v1/auth/login` and `/api/v1/auth/register` (see `AppModule.configure`).

### Prisma Schema

Single schema file at `server/prisma/schema.prisma`. Models for both public and tenant tables are defined together. At runtime, the `search_path` determines which physical schema is queried. Uses `@prisma/adapter-pg` (raw `pg.Pool`) rather than Prisma's default driver.

Cross-schema foreign keys (e.g., `Application.candidateId → users.id`) are managed by application logic, not Prisma relations.

### Authentication & Authorization

JWT-based with role + permission guards. Key files in `server/src/auth/`:

- `jwt.strategy.ts` — Passport JWT extraction & validation
- `jwt-auth.guard.ts` — `@UseGuards(JwtAuthGuard)` for protected routes
- `tenant.guard.ts` — Validates `X-Tenant-ID` matches JWT's `tenantId`
- `permissions.guard.ts` — Fine-grained permission checking
- `permissions.decorator.ts` — `@Permissions(...)` decorator

**JWT payload**: `{ sub, username, email, fullName, tenantId, roles[], permissions[], status }`

**Roles**: `SUPER_ADMIN`, `PLATFORM_ADMIN`, `TENANT_OWNER`, `TENANT_ADMIN`, `PRIMARY_REVIEWER`, `SECONDARY_REVIEWER`, `OPERATOR`, `CANDIDATE`

### Backend Module Structure

All modules registered in `server/src/app.module.ts`. Global prefix: `api/v1`.

| Module | Purpose |
|--------|---------|
| PrismaModule | Database ORM with tenant-aware `client` getter |
| TenantModule | Tenant CRUD, schema creation, MinIO bucket setup |
| AuthModule | JWT login/register, guards, strategy |
| UserModule | User profile management |
| ExamModule | Exam CRUD + published exam public listing |
| ApplicationModule | Candidate application submission |
| ReviewModule | Multi-stage review workflow (PRIMARY → SECONDARY) |
| PaymentModule | Payment orders + mock gateway for development |
| TicketModule | Admission ticket generation with configurable numbering |
| SeatingModule | Venue/room management + seat allocation |
| FileModule | File upload/download via MinIO (tenant-isolated buckets) |
| StatisticsModule | Reporting and analytics |
| SuperAdminModule | Platform-level administration |
| SchedulerModule | Cron-based scheduled tasks |
| CommonModule | Shared utilities (PII handling, security) |

### Frontend Architecture

Next.js 14 App Router. Routes organized by role:
- `/login`, `/register` — Public auth pages
- `/super-admin/` — Platform admin dashboard
- `/[tenantSlug]/admin/` — Tenant admin dashboard
- `/[tenantSlug]/reviewer/` — Review workflow
- `/[tenantSlug]/candidate/` — Candidate portal
- `/exams`, `/my-applications` — Cross-tenant candidate pages

Key patterns:
- `web/src/middleware.ts` — Role-based route protection, token from `auth-token` cookie, tenant slug from URL path
- `web/src/lib/api.ts` — Axios-based API client; auto-injects `Authorization` and `X-Tenant-ID` headers
- `web/src/lib/api-hooks.ts` — React Query hooks for all API endpoints
- `web/src/contexts/AuthContext.tsx` — Client-side auth state, session persistence via `/api/session`
- UI components: shadcn/ui in `src/components/ui/`, Radix primitives, Tailwind CSS
- Forms: `react-hook-form` + `zod` validation
- State: React Query for server state, React Context for auth

### Data Flow: Registration Lifecycle
```
Candidate registers → submits Application (DRAFT→SUBMITTED)
  → Auto-review or Manual review (PRIMARY→SECONDARY)
  → Payment (if fee required)
  → Ticket generation (configurable numbering rules)
  → Seat allocation (venue/room assignment)
```
Application status transitions are tracked in `application_audit_logs`.

## Environment Variables (Backend)

Required in `server/.env`:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname?schema=public
PORT=8081
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## Conventions

- All API routes prefixed with `/api/v1`
- Prisma model names use PascalCase; DB tables use snake_case (`@@map`)
- Tenant-scoped queries must go through `prismaService.client` (not raw `this.prisma`), which sets `search_path`
- Frontend uses path alias `@/*` → `./src/*`
- OpenAPI contract in `api-contracts/` serves as the frontend-backend interface agreement
- Backend test files: `*.spec.ts` co-located with source files
