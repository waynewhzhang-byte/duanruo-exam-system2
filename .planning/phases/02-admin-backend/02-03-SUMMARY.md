---
phase: 02-admin-backend
plan: "03"
subsystem: ui
tags: [react-query, tenant-context, statistics, api-hooks]

# Dependency graph
requires:
  - phase: 01-api-foundation
    provides: apiGetWithTenant helper and useTenant hook for tenant-aware API calls
provides:
  - Score statistics page correctly passes X-Tenant-ID header on all four API calls
affects: [candidate-portal, reviewer-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns: [tenant-aware-api-calls, react-query-enabled-guard]

key-files:
  created: []
  modified:
    - web/src/app/[tenantSlug]/admin/score-statistics/page.tsx

key-decisions:
  - "Use apiGetWithTenant instead of api() for all statistics page calls to ensure X-Tenant-ID header is present"
  - "Extract .content from paginated exam list response ({content: Exam[]}) since /exams returns PaginatedResponse"
  - "Add enabled: !!tenant?.id guard to all queries so they wait until tenant context is resolved"
  - "Add tenant loading guard before examsLoading check to prevent queries firing without tenant"

patterns-established:
  - "Pattern: All tenant-scoped API calls in admin pages must use apiGetWithTenant(endpoint, tenant.id)"
  - "Pattern: Add enabled: !!tenant?.id to React Query queries for tenant-scoped data"
  - "Pattern: Render LoadingSpinner when !tenant before other loading states"

requirements-completed:
  - ADMIN-06

# Metrics
duration: 1min
completed: 2026-03-05
---

# Phase 2 Plan 3: Score Statistics Tenant Context Fix Summary

**Score statistics page fixed to use apiGetWithTenant for all four API calls (exams, funnel, score-analysis, scores/statistics), resolving blank page caused by missing X-Tenant-ID header**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-05T08:55:15Z
- **Completed:** 2026-03-05T08:56:30Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced raw `api()` with `apiGetWithTenant()` for all four API calls in the statistics page
- Added `useTenant` hook to obtain `tenant.id` for the X-Tenant-ID header
- Extracted `.content` from paginated exam list response to get the `Exam[]` array
- Added `enabled: !!tenant?.id` guards to all React Query queries
- Added tenant loading guard (spinner) before the examsLoading check

## Task Commits

Each task was committed atomically:

1. **Task 1: Add tenant context to all API calls in score-statistics page** - `a79f301` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `/Users/Zhuanz/duanruo-exam-system2/duanruo-exam-system2/web/src/app/[tenantSlug]/admin/score-statistics/page.tsx` - Fixed all four API calls to use apiGetWithTenant with tenant.id, added useTenant hook, added enabled guards, added tenant loading guard

## Decisions Made
- Used `apiGetWithTenant` instead of `api()` because the raw `api()` function falls back to localStorage for tenant resolution which may not be populated in all scenarios, whereas explicit tenant.id from `useTenant` hook is reliable
- Extracted paginated response `.content` property because `/exams` endpoint returns `PaginatedResponse<ExamResponse>`, not a raw `Exam[]` array

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Statistics page now correctly loads exam list and statistics data with proper tenant context
- Pattern established for tenant-aware API calls in admin pages (use apiGetWithTenant + useTenant)
- Ready for additional admin backend fixes in subsequent plans

---
*Phase: 02-admin-backend*
*Completed: 2026-03-05*
