---
phase: 02-admin-backend
plan: "02"
subsystem: ui
tags: [react, react-query, next.js, multi-tenant, review-workflow]

# Dependency graph
requires:
  - phase: 01-api-foundation
    provides: apiGetWithTenant/apiPostWithTenant with X-Tenant-ID header injection
provides:
  - ReviewsPageClient using correct /reviews/queue and /reviews/batch-decide endpoints
affects: [review-workflow, admin-backend, 02-admin-backend]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use apiGetWithTenant/apiPostWithTenant for all tenant-scoped API calls (not apiGet/apiPost)"
    - "Review queue accessed via /reviews/queue?examId=&stage= (not /reviews/pending)"
    - "Batch review decisions via /reviews/batch-decide with taskIds array (not applicationIds)"

key-files:
  created: []
  modified:
    - web/src/app/[tenantSlug]/admin/reviews/ReviewsPageClient.tsx

key-decisions:
  - "Review list scoped by examId — exam selector required before queue loads"
  - "Statistics fields are pendingPrimary/pendingSecondary (not primaryPending/secondaryPending)"
  - "Batch action sends taskIds (QueueTask.id), not applicationIds"
  - "Statistics endpoint is /statistics/reviews, not /reviews/statistics"

patterns-established:
  - "Stage tabs (primary/secondary) drive the 'stage' query param to /reviews/queue"
  - "Queue items have shape: { id (taskId), applicationId, stage, status, candidateName?, applicationNo?, ... }"

requirements-completed: [ADMIN-04, ADMIN-05]

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 02 Plan 02: Review Queue Page Fix Summary

**Admin review page rewritten to call /reviews/queue with examId+stage params and /reviews/batch-decide using tenant-aware API functions, fixing all 404 errors on the review management page.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-04T17:55:14Z
- **Completed:** 2026-03-04T17:58:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced all broken `/reviews/pending`, `/reviews/statistics`, `/reviews/batch-review` calls with correct endpoints
- Added exam selector dropdown so admins can choose which exam's review queue to display
- Fixed statistics field name mapping: `pendingPrimary`/`pendingSecondary` (matching actual backend response)
- Replaced `apiGet`/`apiPost` with `apiGetWithTenant`/`apiPostWithTenant` to pass `X-Tenant-ID` header
- Added stage toggle tabs for PRIMARY (初审) and SECONDARY (复审) queue views
- Batch action now uses `taskIds` (queue task IDs) instead of `applicationIds`

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite ReviewsPageClient to use correct review queue API** - `1f51647` (feat)

## Files Created/Modified
- `web/src/app/[tenantSlug]/admin/reviews/ReviewsPageClient.tsx` - Complete rewrite: correct API endpoints, tenant-aware calls, exam selector, stage tabs, fixed statistics field names

## Decisions Made
- Kept existing visual layout structure (table, filters, batch action bar) and only fixed data sources, per plan spec
- Replaced 5-column statistics grid with 4-column (removed approvedToday/rejectedToday, not in backend stats; kept approved total instead)
- "View detail" navigates to `applicationId` (not `taskId`) since the review detail page is application-scoped

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Review management page now loads correct data from backend, fixing ADMIN-04 and ADMIN-05
- Admin can select exam, choose review stage, view pending tasks, and perform batch approve/reject
- Ready to continue with other admin backend fixes

## Self-Check

### Files exist:
- `web/src/app/[tenantSlug]/admin/reviews/ReviewsPageClient.tsx` - FOUND (rewritten)

### Commits exist:
- `1f51647` - FOUND

## Self-Check: PASSED

---
*Phase: 02-admin-backend*
*Completed: 2026-03-04*
