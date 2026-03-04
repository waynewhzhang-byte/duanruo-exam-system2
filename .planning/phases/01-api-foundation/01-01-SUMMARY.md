---
phase: 01-api-foundation
plan: "01"
subsystem: api
tags: [fetch, tenant, error-handling, validation, nextjs]

# Dependency graph
requires: []
provides:
  - "Reliable X-Tenant-ID header injection via URL slug fallback in resolveTenantId()"
  - "Human-readable NestJS validation error messages joined from string[] arrays"
affects: [02-admin-backend, 03-candidate, 04-reviewer, 05-seating]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "tenantRoles JSON array in localStorage used for slug-to-ID resolution"
    - "extractMessage() helper for normalizing NestJS validation error formats"

key-files:
  created: []
  modified:
    - "web/src/lib/api.ts"

key-decisions:
  - "URL slug fallback reads tenantRoles array from localStorage and caches result back to tenant_id key for future calls"
  - "Validation error message extraction handles both string and string[] formats from NestJS via Array.isArray guard"

patterns-established:
  - "resolveTenantId: provided > localStorage('tenant_id') > URL slug + tenantRoles lookup"
  - "extractMessage: Array.isArray(d.message) ? join('; ') : string fallback"

requirements-completed: [API-01, API-03]

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 1 Plan 01: API Client Foundation Summary

**URL slug-to-tenantId resolution via localStorage tenantRoles lookup, and NestJS string[] validation error joining in the API client**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T08:36:33Z
- **Completed:** 2026-03-04T08:38:22Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Fixed `resolveTenantId()` to correctly resolve tenant ID from URL slug when localStorage `tenant_id` is absent, using the stored `tenantRoles` JSON array
- Fixed 400 validation error handling to join NestJS string[] message arrays with '; ' separator instead of producing `[object Object]`
- Added `'exams'` and `'my-applications'` to the reserved top-level paths list, preventing false slug matches

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix resolveTenantId — add URL slug-to-ID fallback** - `5d917a6` (feat)
2. **Task 2: Fix 400 validation error message extraction** - `209a1dd` (fix)

**Plan metadata:** `[docs commit]` (docs: complete plan)

## Files Created/Modified
- `web/src/lib/api.ts` - Core API client: fixed resolveTenantId slug fallback and extractMessage for NestJS validation errors

## Decisions Made
- Slug-to-ID fallback caches result back to `localStorage('tenant_id')` so subsequent calls are instant (avoids repeated JSON.parse)
- `extractMessage()` extracted as inline helper function for clarity; handles three formats: `string[]`, `string`, and nested `error.message`
- Error code falls back to `data?.error` (the string "Bad Request") when no `code` field present, rather than silently using `'HTTP_ERROR'`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API client now reliably sends `X-Tenant-ID` on all requests from `[tenantSlug]` routes even without prior `tenant_id` in localStorage
- Validation form errors from backend will now surface as readable messages to users (e.g., "name must not be empty; startDate must be a Date")
- Ready to proceed with Phase 1 Plan 02 and subsequent admin/candidate/reviewer phases

## Self-Check: PASSED

- FOUND: web/src/lib/api.ts
- FOUND: .planning/phases/01-api-foundation/01-01-SUMMARY.md
- FOUND: commit 5d917a6 (Task 1)
- FOUND: commit 209a1dd (Task 2)

---
*Phase: 01-api-foundation*
*Completed: 2026-03-04*
