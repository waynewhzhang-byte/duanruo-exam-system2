---
phase: 02-admin-backend
plan: "04"
subsystem: admin-venue-management
tags: [frontend, venue, status-badge, exam-fields]
dependency_graph:
  requires: [02-01]
  provides: [venue-page-correct-status-display]
  affects: [web/src/app/[tenantSlug]/admin/exams/[examId]/venues/page.tsx]
tech_stack:
  added: []
  patterns: [status-badge-correct-values, examStart-examEnd-field-alignment]
key_files:
  created: []
  modified:
    - web/src/app/[tenantSlug]/admin/exams/[examId]/venues/page.tsx
    - web/src/lib/schemas.ts
    - server/src/exam/exam.service.ts
decisions:
  - Add IN_PROGRESS to ExamStatus Zod enum to match all backend status values
metrics:
  duration: 3 min
  completed: "2026-03-05"
  tasks: 2
  files: 3
---

# Phase 2 Plan 4: Venue Page Status Badge Fix Summary

**One-liner:** Fixed venue page status badges to use correct backend exam status values (OPEN/IN_PROGRESS/CLOSED/COMPLETED) and aligned examStart/examEnd display.

## What Was Built

The venue management page (`/[tenantSlug]/admin/exams/[examId]/venues`) had incorrect exam status badge rendering using `PUBLISHED` and `CANCELLED` status values that the backend never returns. Additionally the exam time card was referencing `startDate`/`endDate` fields instead of the correct `examStart`/`examEnd` fields (aligned in plan 02-01).

## Tasks Completed

### Task 1: Fix venue page exam status badge and verify seating endpoint health
- **Commit:** d9836ba
- **Files:** `web/src/app/[tenantSlug]/admin/exams/[examId]/venues/page.tsx`, `web/src/lib/schemas.ts`
- Replaced `PUBLISHED`/`CANCELLED` badge variant and labels with correct `OPEN`/`IN_PROGRESS`/`CLOSED`/`COMPLETED` values in both the header Badge and the Stats Cards section
- Fixed exam time card to use `exam.examStart`/`exam.examEnd` instead of `(exam as any).startDate`/`(exam as any).endDate`
- Added fallback label for any unrecognized status value

### Task 2: Confirm backend ExamService mapToResponse includes examStart/examEnd
- **Commit:** 6bff093
- **Files:** `server/src/exam/exam.service.ts`
- Confirmed `examStart` and `examEnd` fields exist in `mapToResponse()` at lines 182-183
- Added inline comment `// examStart/examEnd fields confirmed` to document this explicitly
- Backend compiles without errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added IN_PROGRESS to ExamStatus Zod enum in schemas.ts**
- **Found during:** Task 1 — TypeScript type-check reported TS2367 comparison error
- **Issue:** `ExamStatus` enum in `web/src/lib/schemas.ts` did not include `IN_PROGRESS` which is a valid backend status. The type `'"DRAFT" | "PUBLISHED" | ... | "OPEN" | "CLOSED"'` did not overlap with `'IN_PROGRESS'` causing TypeScript errors.
- **Fix:** Added `'IN_PROGRESS'` to the Zod enum in schemas.ts
- **Files modified:** `web/src/lib/schemas.ts`
- **Commit:** d9836ba (included in Task 1 commit)

## Verification Results

1. `grep PUBLISHED|CANCELLED venues/page.tsx` — returns nothing (wrong status values removed)
2. `grep OPEN|IN_PROGRESS|COMPLETED venues/page.tsx` — shows correct status labels at lines 69-96
3. `grep examStart.*exam.examStart exam.service.ts` — shows mapping at line 182
4. `npm run type-check` — passes with no errors
5. `npm run build` (server) — passes with no errors

## Self-Check: PASSED

- [x] `web/src/app/[tenantSlug]/admin/exams/[examId]/venues/page.tsx` — modified
- [x] `web/src/lib/schemas.ts` — modified (IN_PROGRESS added)
- [x] `server/src/exam/exam.service.ts` — modified (comment added)
- [x] commit d9836ba — exists
- [x] commit 6bff093 — exists
