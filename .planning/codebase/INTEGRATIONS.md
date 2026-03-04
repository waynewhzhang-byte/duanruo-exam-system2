# External Integrations

**Analysis Date:** 2026-03-04

## APIs & External Services

**Payment Gateway (Development/Mock):**
- Mock Gateway - For development/testing only
  - SDK/Client: Built-in, no external SDK required
  - File: `server/src/payment/mock-gateway.service.ts`
  - Purpose: Simulates Alipay/WeChat payment flows in development
  - Channels: ALIPAY, WECHAT, MOCK (configurable in `PaymentOrder.channel`)
  - Implementation: In-memory order cache with 5-minute expiry
  - Status: Not ready for production (comment: "生产环境应使用Redis" - production should use Redis)

**Email Notifications (Mock):**
- Mock Email Provider - For development/testing only
  - File: `server/src/common/notification/email.provider.ts`
  - Service: `server/src/common/notification/notification.service.ts`
  - Purpose: Send notifications for review results and ticket generation
  - Channels: EMAIL, SMS (SMS currently mock-only)
  - Implementation: Logs instead of sending real emails

## Data Storage

**Databases:**
- PostgreSQL 12+
  - Connection: Via `DATABASE_URL` environment variable (format: postgresql://user:pass@host:port/dbname?schema=public)
  - Client: Prisma 6.2.1 with `@prisma/adapter-pg` (raw pg.Pool driver)
  - Adapter: `@prisma/adapter-pg` 6.2.1 - Uses native PostgreSQL adapter
  - Driver: `pg` 8.16.3 - Direct PostgreSQL client
  - Schema Strategy: Schema-per-tenant with public schema for platform data
    - `public` schema: `users`, `tenants`, `user_tenant_roles`
    - `tenant_{code}` schema: Exam, application, review, payment, ticket data
  - Multi-tenancy: AsyncLocalStorage-based search_path switching via Prisma `$extends`
  - File: `server/prisma/schema.prisma`

**File Storage:**
- MinIO (S3-compatible object storage)
  - Connection: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - Client: `minio` 8.0.6 SDK
  - Setup: `server/src/file/file.module.ts`
  - Implementation: `server/src/file/file.service.ts`
  - Bucket Strategy: Tenant-isolated buckets (format: `tenant-{code}-files`)
  - Lifecycle: Auto-cleanup of temp uploads after 1 day
  - Presigned URLs: With public endpoint replacement for Docker/proxy scenarios
  - File Tracking: Database records in `FileRecord` model track upload status, virus scan status, access logs
  - Expiry: Presigned upload URLs expire per `MINIO_PRESIGN_EXPIRES` (default 3600s), download URLs expire at 1800s

**Caching:**
- Redis (via cache-manager)
  - Connection: `REDIS_URL` environment variable (default redis://localhost:6379)
  - Client: `ioredis` 5.9.3
  - Abstraction: `cache-manager` 7.2.8 with `cache-manager-redis-yet` 5.1.5 backend
  - Setup: Global CacheModule in `server/src/app.module.ts` with async factory
  - TTL: 1 hour default (configurable)
  - Purpose: Application-level caching (guards, computed results)
  - Note: Mock payment gateway currently uses in-memory Map; should migrate to Redis in production

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: NestJS + Passport
  - Files:
    - `server/src/auth/auth.service.ts` - Login/register logic
    - `server/src/auth/jwt.strategy.ts` - JWT extraction from Authorization header
    - `server/src/auth/jwt-auth.guard.ts` - Route protection guard
    - `server/src/auth/permissions.guard.ts` - Fine-grained permission checking
    - `server/src/auth/permissions.decorator.ts` - `@Permissions(...)` decorator
  - Token Source: JWT signed with `JWT_SECRET` (configurable expiry via `JWT_EXPIRES_IN`)
  - Payload: `{ sub, username, email, fullName, tenantId, roles[], permissions[], status }`
  - Cookie Storage: `auth-token` cookie (fallback: localStorage)
  - Roles: `SUPER_ADMIN`, `PLATFORM_ADMIN`, `TENANT_OWNER`, `TENANT_ADMIN`, `PRIMARY_REVIEWER`, `SECONDARY_REVIEWER`, `OPERATOR`, `CANDIDATE`
  - Password Hashing: bcrypt 6.0.0
  - Frontend Integration: `web/src/lib/api.ts` auto-injects Bearer token in Authorization header

**Tenant Identification:**
- Header-based tenant routing
  - Headers: `X-Tenant-ID` or `X-Tenant-Slug`
  - Middleware: `server/src/tenant/tenant.middleware.ts` - Extracts tenant and sets AsyncLocalStorage context
  - Schema Routing: `PrismaService` executes `SET LOCAL search_path TO "tenant_xxx", public` per request
  - Frontend: Automatically resolves tenant ID from localStorage or URL path via `web/src/lib/api.ts`
  - Excluded Routes: `/api/v1/auth/login`, `/api/v1/auth/register` (no tenant context required)

## Monitoring & Observability

**Error Tracking:**
- Not detected - Errors are logged to console/application logs only
- Recommendation: Consider Sentry or similar for production

**Logs:**
- NestJS logger (console-based)
  - Configuration: `server/src/prisma/prisma.service.ts` logs errors and warnings
  - Severity levels: error, warn (configured in PrismaClient constructor)
  - File-based logging: Not currently configured

## CI/CD & Deployment

**Hosting:**
- Not configured in codebase - Can be deployed to any Node.js environment
- Supported: Docker, Kubernetes, traditional VPS, Platform-as-a-Service (Heroku, Railway, etc.)

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or Jenkins configuration present

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection (production: managed DB recommended)
- `JWT_SECRET` - JWT signing key (production: set to strong random value)
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - MinIO
- `REDIS_URL` - Redis connection
- `NODE_ENV` - "development" or "production"

**Secrets location:**
- Development: `.env` file (gitignored via `.gitignore`)
- Production: Environment variables (recommended: Kubernetes secrets, Docker secrets, vault)
- Note: `.env` file contains plaintext secrets for development only; never commit to production

## Webhooks & Callbacks

**Incoming:**
- Mock Payment Callback Endpoint
  - Route: `/api/v1/payment/mock-callback` (via MockGatewayController)
  - Purpose: Simulates Alipay/WeChat payment success/failure callbacks
  - Implementation: `server/src/payment/mock-gateway.controller.ts`
  - Method: POST with JSON payload

**Outgoing:**
- Mock Payment Callbacks (to frontend)
  - Service: `server/src/payment/mock-gateway.service.ts`
  - Flow: Mock gateway sends POST callback to frontend mock payment page
  - Payload: `{ outTradeNo, transactionId, status, amount, currency, paidAt }`
  - Purpose: Completes payment flow simulation in development

## Frontend-Backend Communication

**API Transport:**
- HTTP/REST via axios
  - Client: `web/src/lib/api.ts` - Fetch-based wrapper with zod schema validation
  - Headers auto-injected:
    - `Authorization: Bearer {jwt_token}` - From cookie or localStorage
    - `X-Tenant-ID: {tenantId}` - From localStorage or URL context
    - `Content-Type: application/json` (for POST/PUT/PATCH)
  - Error Handling: Custom `APIError` class with code, message, status, traceId
  - Response Format: NestJS ApiResult wrapper `{ success, data, error, traceId }`

**API Contract:**
- OpenAPI 3.0 specification
  - Export: `web/openapi/exam-system-api.json` (via `npm run openapi:export` from backend at localhost:8081)
  - Validation: `npm run openapi:validate` - Validates OpenAPI spec
  - Generation: `npm run openapi:generate` - Generates TypeScript types from spec
  - Tools: `openapi-typescript` and `openapi-fetch` for type-safe client generation
  - Contract Testing: `dredd` for integration testing against OpenAPI spec

## Tenant & Multi-Tenancy

**Tenant Isolation:**
- Schema-per-Tenant pattern
  - Platform data (public schema): Users, tenants, roles
  - Tenant data (tenant_{code} schema): All exam, application, review, ticket, payment data
  - Isolation Mechanism: PostgreSQL search_path switching per request via Prisma `$extends`
  - File isolation: MinIO buckets per tenant (tenant-{code}-files)
  - Request Flow: TenantMiddleware → AsyncLocalStorage context → PrismaService auto-switches schema

**Tenant Creation:**
- Service: `server/src/tenant/tenant.service.ts`
- Process:
  1. Create `Tenant` record in public schema
  2. Execute SQL template to create PostgreSQL schema
  3. Create MinIO bucket for tenant files
  - File: `server/src/tenant/tenant-schema-template.sql`

---

*Integration audit: 2026-03-04*
