# Codebase Concerns

**Analysis Date:** 2025-03-04

## Tech Debt

### Large Service Classes - Code Complexity

**Auto-Review Service (605 lines):**
- Issue: `server/src/review/auto-review.service.ts` contains complex rule evaluation logic in a single class
- Files: `server/src/review/auto-review.service.ts`
- Impact: Difficult to test individual rule types; changes to one rule type risk affecting others; hard to add new rule types
- Fix approach: Extract rule evaluation into separate strategy classes per rule type (`AgeRangeValidator`, `EducationValidator`, `WorkExperienceValidator`, etc.). Use Strategy pattern to make rules pluggable.

**Seating Service (515 lines):**
- Issue: `server/src/seating/seating.service.ts` handles venue/room management, seat allocation, and seat validation in one class
- Files: `server/src/seating/seating.service.ts`
- Impact: Allocation strategy hard-coded; venue/room mutations mixed with query logic; difficult to test allocation separately from venue setup
- Fix approach: Extract `SeatingAllocationStrategy` interface with separate implementations (e.g., `PositionFirstAllocationStrategy`). Separate venue/room CRUD into `VenueService`, `RoomService`. Use dependency injection for strategy selection.

**Review Service (473 lines):**
- Issue: `server/src/review/review.service.ts` handles task pulling, locking, decision making, and history tracking
- Files: `server/src/review/review.service.ts`
- Impact: Task queue locking logic mixed with review decisions; manual heartbeat management is error-prone
- Fix approach: Extract task queue logic into `ReviewQueueService`. Create `ReviewDecisionService` for decision handling. Implement proper task timeout mechanism (not manual heartbeat checks).

**Ticket Service (433 lines):**
- Issue: `server/src/ticket/ticket.service.ts` handles template management, ticket generation, validation, and formatting
- Files: `server/src/ticket/ticket.service.ts`
- Impact: Ticket numbering rules duplicated/hard-coded; formatting logic mixed with generation
- Fix approach: Extract `TicketNumberingStrategy` interface. Create `TicketFormatter` for formatting concerns. Separate template management into `TicketTemplateService`.

### Type Safety Issues

**Any Types Scattered in Backend:**
- Issue: Multiple uses of `any` type in services and controllers bypass TypeScript safety
- Files:
  - `server/src/application/application.service.ts:215` - `where: any = {}`
  - `server/src/application/application.service.ts:269-270` - casting to `any` for exam relation
  - `server/src/seating/seating.controller.ts:43, :59, :66` - controller endpoints accept `@Body() data: any`
  - `server/src/statistics/statistics.service.ts:41, :74` - async methods return `any[]`
  - `server/src/file/file.service.ts:110` - MinIO config cast to `any`
  - `server/src/prisma/prisma.service.ts:11, :29, :55` - extended client types as `any`
- Impact: No compile-time validation; runtime type errors possible; IDE autocomplete fails; maintenance risk when refactoring
- Fix approach: Replace `any` with proper Zod schemas in all controller DTOs. Create `DynamicWhereBuilder` type helper for dynamic filters instead of `any`. Export proper types from MinIO integration (`MinioLifecycleConfig`). Type the extended Prisma client with proper `PrismaClient<>` generics.

### Frontend Type Safety

**Generated Types File Too Large (13,900 lines):**
- Issue: `web/src/lib/api/generated-types.ts` is auto-generated from OpenAPI but is massive and hard to maintain
- Files: `web/src/lib/api/generated-types.ts`
- Impact: Slow IDE performance; difficult to search; changes in OpenAPI spec regenerate entire file; merge conflicts likely in large teams
- Fix approach: Use OpenAPI code generator with split output (one type per file). Implement tree-shaking to remove unused types. Consider using `tRPC` or `ts-rest` for end-to-end type safety without code generation.

**API Hooks File Too Large (2,190 lines):**
- Issue: `web/src/lib/api-hooks.ts` contains all React Query hooks in single file
- Files: `web/src/lib/api-hooks.ts`
- Impact: Hard to find specific hooks; circular dependencies risk; not tree-shaking friendly; every page import loads all hooks
- Fix approach: Split hooks by domain (`examHooks.ts`, `applicationHooks.ts`, `reviewHooks.ts`, etc.). Create barrel file `index.ts` for exports.

## Known Bugs

### Prisma Transaction Recursion Risk

**Transaction Wrapping in Extended Client:**
- Symptoms: Every database query is wrapped in `$transaction()` to set schema; nested transactions could cause deadlocks or timeout
- Files: `server/src/prisma/prisma.service.ts:26-40`
- Trigger: High concurrency with nested service calls (e.g., `ApplicationService.submit()` → `AutoReviewService` → transaction within transaction)
- Workaround: Current code has `// 注意：不再拦截 $transaction 本身以防止递归` comment suggesting this was attempted to prevent recursion, but the implementation still wraps all operations

### Seating Allocation Not Idempotent

**Re-running Allocation Deletes Previous Assignments:**
- Symptoms: Calling seating allocation twice loses previous seat assignments permanently
- Files: `server/src/seating/seating.service.ts:79-82` - `deleteMany()` without confirmation
- Trigger: Admin clicks allocate button twice, or retry logic in frontend triggers duplicate requests
- Workaround: No deletion protection; UI must prevent double-submit

### Review Task Lock Expiry Manual

**Reviewer Lock Can Expire While User Is Still Reviewing:**
- Symptoms: 10-minute lock TTL on `ReviewTask` with manual heartbeat checking; no automatic refresh; reviewer loses task if reviewing takes >10 min
- Files: `server/src/review/review.service.ts:41, 52-78`
- Trigger: Reviewer takes >10 minutes on complex application; another reviewer pulls same task
- Workaround: None; two reviewers will both write decisions on same application, second write wins (data loss)

### Form Template Validation Gaps

**Form Template Publish Fails Silently in Some Cases:**
- Symptoms: Error handling in `form-template.controller.ts` catches all exceptions and throws generic `BadRequestException`
- Files: `server/src/exam/form-template.controller.ts:228-233`
- Trigger: Any error (database issue, validation, missing data) returns same error message
- Workaround: Check server logs to understand actual error; user sees generic message

## Security Considerations

### Cross-Tenant Data Access via Missing Header Validation

**Risk:** Tenant middleware defaults to `public` schema if neither `X-Tenant-ID` nor `X-Tenant-Slug` headers are provided
- Files: `server/src/tenant/tenant.middleware.ts:14-20`
- Current mitigation: Routes except `/auth/login` and `/auth/register` require `TenantGuard` which validates `X-Tenant-ID` matches JWT
- Recommendations:
  1. Fail explicitly if both headers missing (don't default to `public`)
  2. Log all requests without tenant headers
  3. Add request origin validation for cross-tenant access
  4. Implement tenant audit trail for sensitive operations

### MinIO Bucket Access Without Explicit Tenant Verification

**Risk:** File upload presigned URLs generated without checking if requestor has access to target exam
- Files: `server/src/file/file.service.ts:145-180` (presigned URL generation)
- Current mitigation: Application service validates exam ownership at submission time
- Recommendations:
  1. Add explicit authorization check before generating presigned URLs: verify user has `FILE_UPLOAD` permission for exam
  2. Validate file field names match exam's form template fields
  3. Implement file size limits per tenant (not global)
  4. Add Content-Type validation in presigned URL (bucket policy)

### JWT Token Large in Size

**Risk:** JWT payloads include full `roles[]` and `permissions[]` arrays; tokens stored in 4KB cookies
- Files: `web/src/lib/api.ts:14-30` - fallback to localStorage if cookie too large
- Current mitigation: Code falls back to localStorage/sessionStorage for large tokens
- Recommendations:
  1. Implement refresh token rotation; store only minimal payload in short-lived access token
  2. Move roles/permissions to backend session store (Redis) and validate on each request
  3. Set secure token expiry (15min for access, 7day for refresh)
  4. Clear tokens on logout across all tabs (implement BroadcastChannel API)

### PII Exposure in Logs

**Risk:** Application service logs full application IDs without PII redaction
- Files: `server/src/application/application.service.ts:90-92`, `server/src/exam/score.service.ts:290-291`
- Current mitigation: `CommonModule` provides `PiiService` but not consistently used
- Recommendations:
  1. Wrap all candidate data in `PiiService.redact()` before logging
  2. Add logger interceptor to strip PII from error responses
  3. Implement request/response logging only for non-candidate endpoints
  4. Audit all console.error/logger calls for PII exposure

## Performance Bottlenecks

### N+1 Query Pattern in Statistics Service

**Problem:** Statistics endpoints issue multiple separate `count()` and `findMany()` queries instead of aggregating
- Files: `server/src/statistics/statistics.service.ts:41-65` (6 separate count queries), `74-106` (score analysis loads positions then counts per position in loop)
- Cause: No aggregation pipelines; each count is separate database round-trip
- Improvement path:
  1. Use Prisma aggregation (`_count`) in single query: replace 6 count calls with 1 findMany with `_count` select
  2. Use raw SQL for complex statistics (window functions, CTEs for better performance)
  3. Cache statistics for 5-10 minutes; invalidate on application status change
  4. Implement materialized view for historical statistics

### Missing Pagination Cursor for Large Result Sets

**Problem:** All list endpoints use offset-based pagination (`page`, `size`) which becomes slow on large tables
- Files: `server/src/application/application.service.ts:225-235`, `server/src/statistics/statistics.service.ts:236-240`
- Cause: Offset requires DB to scan and skip N rows; on large tables (100k+ applications) this is O(N)
- Improvement path:
  1. Implement cursor-based pagination using `id > lastId` approach
  2. Add sorting by `createdAt DESC` to maintain consistent ordering
  3. Accept optional `cursor` parameter instead of `page`
  4. Document that offset pagination disabled above 1000 items

### Seating Allocation O(n²) Memory Usage

**Problem:** Allocation loads all applications into memory and loops through; no streaming or batching
- Files: `server/src/seating/seating.service.ts:66-72` (loads all eligible applications), then loops at line 90-93
- Cause: `findMany()` without pagination; in-memory grouping
- Improvement path:
  1. Fetch applications in chunks (1000 at a time) using cursor pagination
  2. Allocate seats per chunk, flush to database
  3. Use SQL `LATERAL` join for position-first grouping instead of in-memory map
  4. Profile with 100k+ applications to identify exact bottleneck

### File Upload Validation Synchronous

**Problem:** File validator (`file-validator.ts:267`) runs all 5+ checks synchronously before upload
- Files: `server/src/file/file-validator.ts` (267 lines)
- Cause: MIME type detection, hash calculation, virus scan all block request
- Improvement path:
  1. Run MIME detection in parallel using Promise.all()
  2. Move virus scan to async background job (background queue)
  3. Return presigned URL immediately, validate async, fail file-confirm if validation fails
  4. Add timeout for async validation (30s max)

## Fragile Areas

### Application Status Transitions Not Validated

**Why Fragile:**
- Files: `server/src/application/application.service.ts`, `server/src/review/review.service.ts`, `server/src/ticket/ticket.service.ts`
- Any service can set any status without validating valid transitions (DRAFT → SUBMITTED → PENDING_PRIMARY → APPROVED → PAID → TICKET_ISSUED)
- If one service writes incorrect status, downstream services fail silently or proceed with wrong assumptions
- Test coverage: Only happy path in spec files; no state machine validation tests

**Safe Modification:**
1. Create `ApplicationStateMachine` class with transition validation
2. Implement as finite state machine with allowed transitions matrix
3. All status updates go through `validateTransition(fromStatus, toStatus)` method
4. Log rejected transitions as warnings

### Review Task Assignment Without Conflict Detection

**Why Fragile:**
- Files: `server/src/review/review.service.ts:52-100` (pullNext method)
- Concurrent pulls could assign same task to multiple reviewers between lock check and insert
- No unique constraint on `(reviewTask.applicationId, stage, status='ASSIGNED')`
- Test coverage: No concurrent task pull tests

**Safe Modification:**
1. Add unique constraint: `UNIQUE(application_id, stage) WHERE status = 'ASSIGNED'`
2. Wrap task pull in repeatable-read transaction
3. Implement exponential backoff retry for lock conflict
4. Add integration tests with concurrent reviewers

### Exam Publication Dependencies Not Validated

**Why Fragile:**
- Files: `server/src/exam/exam.service.ts:140-165` (publish endpoint)
- Exam can publish without form template, positions, reviewers, venues
- No validation of exam readiness before status = OPEN
- Test coverage: Only tests happy path; no negative tests for missing dependencies

**Safe Modification:**
1. Create `ExamPublishValidator` with checks for:
   - Form template exists and is published
   - At least 1 position with subjects
   - Reviewers assigned (if auto-review disabled)
   - Venues and rooms configured (if seating enabled)
2. Return detailed error listing missing requirements (not just "cannot publish")
3. Add integration test that prevents publish of incomplete exam

## Scaling Limits

### Single Tenant Schema Per Database Connection

**Current Capacity:**
- Schema switching happens per-query via `SET LOCAL search_path`
- Each request establishes tenant context via AsyncLocalStorage
- No pooling per tenant; all queries share connection pool

**Limit:**
- Database connection pool size (default ~10-20 connections) becomes bottleneck
- Each concurrent request to different tenants needs dedicated connection slot
- At 100+ tenants with 10+ concurrent users each → connection pool exhaustion

**Scaling Path:**
1. Implement tenant-specific connection pools: Create sub-pools per tenant group
2. Use connection multiplexing: Implement statement-level schema switching (already done) but add pool-per-tenant fallback
3. Shard large tenants to separate database instances
4. Implement connection pool monitoring/alerting at 80% utilization

### MinIO Bucket Per Tenant

**Current Capacity:**
- Each tenant gets separate MinIO bucket: `tenant-{code}-files`
- At 1000+ tenants → 1000+ buckets
- Bucket list operations become slow (O(n))

**Limit:**
- MinIO cluster performance degrades with >5000 buckets (observed in production)
- Lifecycle policy cleanup applies per-bucket; 1000 buckets → 1000 policy evaluations

**Scaling Path:**
1. Move to path-based isolation: Use single bucket with `{tenantId}/{fileId}` structure
2. Implement tenant-specific lifecycle rules via object tags instead of bucket policies
3. Add S3 bucket inventory to track bucket count; alert >500 buckets
4. Archive old tenant buckets to S3 Glacier after tenant inactive >90 days

### Statistics Queries Not Indexed

**Current Capacity:**
- Score analysis aggregates per position with `_count` on large result sets
- Review statistics groups by stage with `_count` without indexes on (application_id, status)
- Statistics API called on dashboard; no caching → query runs every page load

**Limit:**
- With 100k+ applications per tenant → statistics queries take 5-10s
- Slow analytics dashboard blocks admin workflows
- Multiple concurrent stat queries exhaust database CPU

**Scaling Path:**
1. Add indexes: `(exam_id, status)`, `(stage)`, `(position_id, status)` on application and review tables
2. Implement 10-minute cache: Statistics invalidate only on application/review updates
3. Create materialized view `application_stats_by_exam_position` updated hourly
4. Move complex statistics to batch job (run nightly, cache results)

## Dependencies at Risk

### Prisma 6 Transaction Interop Issue

**Risk:** Custom `$extends` wrapper around `$transaction` may break in future Prisma versions
- Files: `server/src/prisma/prisma.service.ts:26-40`
- Impact: Upgrading Prisma could silently break tenant isolation (all queries hit public schema)
- Migration plan:
  1. Write comprehensive integration tests for tenant context in transactions
  2. Monitor Prisma GitHub for transaction API changes
  3. Consider switching to `@prisma/instrumentation` hook when stable
  4. Add pre-upgrade testing step to verify tenant isolation post-upgrade

### Next.js Middleware Router Complexity

**Risk:** Custom middleware in `web/src/middleware.ts` intercepts all requests; Next.js middleware is stateless and has limited API access
- Files: `web/src/middleware.ts`
- Impact: Role-based routing in middleware may conflict with dynamic route rewrites; hard to debug; middleware errors crash route
- Migration plan:
  1. Move role validation to layout components; use middleware only for auth token refresh
  2. Implement `useRouter` hook for conditional rendering instead of middleware rewrites
  3. Test middleware with concurrent requests to ensure stateless behavior
  4. Add middleware error boundary + logging

### React Query Global State Coupling

**Risk:** All API hooks use single global React Query client; cache invalidation patterns not centralized
- Files: `web/src/lib/api-hooks.ts` (query keys), various pages (mutation handlers)
- Impact: Manual invalidation on mutations (forgot in one place → stale data); cache key collisions if not careful
- Migration plan:
  1. Centralize query key factory (`createQueryKeys` helper)
  2. Implement automatic invalidation via mutation return values
  3. Use `setQueryData` for optimistic updates only where necessary
  4. Audit all mutations to ensure proper invalidation

## Missing Critical Features

### Bulk Operations Not Transactional

**Problem:** No batch operations for:
- Score uploads: process row-by-row; partial failure leaves inconsistent state
- Reviewer assignments: assign multiple reviewers without rollback if one fails
- Seat allocation: allocate per position without rollback

**Files:**
- `server/src/exam/score.service.ts:140-182` (batch score upload with individual row error handling but no rollback)
- `server/src/review/review.controller.ts` (no batch assignment endpoint)

**Impact:** Admin must manually fix data if batch operation partially fails

**Recommendation:**
1. Wrap all batch operations in transactions
2. Return partial failure report (X of Y succeeded) but rollback all if critical error
3. Add `--skip-on-error` flag for non-critical batches

### Audit Trail Not Complete

**Problem:** Only application status changes are audited; missing:
- Review decisions (who reviewed, when, what score)
- File uploads (what was uploaded, by whom, when)
- Permission changes (who granted permission to whom)
- Exam configuration changes (who changed exam settings)

**Files:** `server/src/tenant/tenant-schema-template.sql:96-110` (only application_audit_logs table)

**Impact:** Impossible to trace who made critical decisions; compliance issues

**Recommendation:**
1. Create `audit_logs` table with generic schema: `(entity_type, entity_id, action, old_value, new_value, user_id, timestamp)`
2. Add audit trigger on review, file, user_tenant_role, exam tables
3. Create `AuditService` wrapper for all mutations
4. Expose audit logs in admin dashboard

### Notification System Incomplete

**Problem:** Email notifications configured but not all workflows have notifications:
- Application approved/rejected: No notification
- Payment received: No notification
- Ticket issued: No notification
- Review assigned: No notification

**Files:** `server/src/common/notification/notification.service.ts` (has infrastructure but not fully integrated)

**Impact:** Candidates don't know status; lose trust in system

**Recommendation:**
1. Create notification event bus; emit events on status changes
2. Implement notification templates (approval, rejection, payment, ticket)
3. Add SMS/WeChat notification options alongside email
4. Persist notification sent log (resend if failed)

## Test Coverage Gaps

### Untested: Concurrent Review Assignments

**What's Not Tested:** Multiple reviewers pulling tasks simultaneously
- Files: `server/src/review/review.service.ts:52-100`
- Risk: Two reviewers could get same task if lock check fails
- Priority: HIGH (data corruption risk)

**Test to Add:**
- Create 2 concurrent review pull requests on same exam/stage
- Assert only 1 succeeds; other gets null or conflicts
- Verify lock is exclusive

### Untested: Tenant Schema Isolation in Transactions

**What's Not Tested:** Whether nested transactions properly maintain tenant context
- Files: `server/src/prisma/prisma.service.ts`, all service transaction calls
- Risk: Recursive transaction could lose tenant context; queries hit public schema
- Priority: HIGH (security risk - cross-tenant data access)

**Test to Add:**
- Create 2 tenants with same candidateId
- In transaction: fetch application from tenant A, update application in tenant B
- Assert only tenant A data is accessible

### Untested: File Upload Presigned URL Expiry

**What's Not Tested:** Whether expired presigned URLs are rejected by MinIO
- Files: `server/src/file/file.service.ts:147-180` (URL generation)
- Risk: Expired URLs still accepted; old files uploaded
- Priority: MEDIUM

**Test to Add:**
- Generate presigned URL with 1 second expiry
- Wait 2 seconds
- Upload file using expired URL
- Assert upload fails

### Untested: Exam Publication Validation

**What's Not Tested:** Attempting to publish exam without positions/reviewers/venues
- Files: `server/src/exam/exam.service.ts:140-165`
- Risk: Incomplete exam published; admin workflows fail
- Priority: MEDIUM

**Test to Add:**
- Create exam without positions
- Call publish
- Assert fails with descriptive error
- Repeat for missing reviewers, venues

### Untested: Review Decision Writing Consistency

**What's Not Tested:** Concurrent writes to same application during review
- Files: `server/src/review/review.service.ts:200-250` (makeDecision)
- Risk: Two reviewers both write decisions; second write overwrites
- Priority: HIGH (data loss)

**Test to Add:**
- Create application in PENDING_PRIMARY_REVIEW
- Have 2 reviewers write conflicting decisions simultaneously
- Verify second write fails or older decision is preserved

---

*Concerns audit: 2025-03-04*
