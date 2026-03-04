---
phase: 02-admin-backend
plan: "01"
subsystem: frontend-exam-module
tags: [frontend, exam, field-names, schema, pagination, bug-fix]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [working-exam-list, working-exam-detail, working-exam-edit]
  affects: [admin-exam-module]
tech_stack:
  added: []
  patterns: [zod-schema-field-alignment, pagination-type-correctness]
key_files:
  created: []
  modified:
    - web/src/lib/schemas.ts
    - web/src/app/[tenantSlug]/admin/exams/page.tsx
    - web/src/app/[tenantSlug]/admin/exams/[examId]/detail/page.tsx
    - web/src/app/[tenantSlug]/admin/exams/[examId]/edit/page.tsx
    - web/src/components/admin/exam-detail/ExamBasicInfo.tsx
decisions:
  - Backend consistently uses examStart/examEnd (not examStartTime/examEndTime); frontend aligned to backend naming
  - ExamsResponse type uses pageSize/currentPage to match backend PaginatedResponse DTO
  - Count display updated to use totalElements for accurate cross-page total (not content.length which is page-local)
metrics:
  duration: 4 min
  completed: 2026-03-04
  tasks_completed: 2
  files_modified: 5
---

# Phase 2 Plan 01: Exam Field Name Mismatches and Pagination Type Fix Summary

Fixed exam list pagination field mismatch and exam detail/edit page field name mismatches (registrationStartTime vs registrationStart, examStartTime vs examStart) so exam data displays and edits correctly.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add examStart/examEnd to ExamResponse schema | 4b45d7c | web/src/lib/schemas.ts |
| 2 | Fix exam list pagination types and field name mismatches | da0faee | page.tsx, detail/page.tsx, edit/page.tsx, ExamBasicInfo.tsx |

## What Was Built

### Task 1: Frontend Schema Fields
Added `examStart` and `examEnd` to both `ExamResponse` and `ExamUpdateRequest` Zod schemas in `web/src/lib/schemas.ts`. These fields exist in the backend DTO and `mapToResponse()` but were absent from the frontend schema, causing them to be stripped during Zod validation.

### Task 2: Field Name and Pagination Fixes

**Exam list page (`exams/page.tsx`):**
- Fixed `ExamsResponse` type: `size` -> `pageSize`, `number` -> `currentPage` to match backend `PaginatedResponse` DTO
- Updated count display: `content.length` -> `totalElements` to show accurate total count across pages (not just current page)

**Exam detail page (`[examId]/detail/page.tsx`):**
- Fixed `Exam` interface: `registrationStartTime/registrationEndTime/examStartTime/examEndTime` -> `registrationStart/registrationEnd/examStart/examEnd` with optional typing

**Exam edit page (`[examId]/edit/page.tsx`):**
- Fixed `Exam` interface, `ExamFormData` interface, `useState` initial values, `useEffect` population logic, form validation error keys, and all JSX input field IDs/references

**ExamBasicInfo component:**
- Fixed `urlSuffix` initialization: `exam.urlSuffix` -> `exam.slug` (backend returns `slug`, not `urlSuffix`)

## Verification

- `npm run type-check` passes with 0 errors
- No old field names (`registrationStartTime`, `examStartTime`, `.size`, `.number`) remain in target files
- `examStart`/`examEnd` present in ExamResponse and ExamUpdateRequest schemas

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

Files verified:
- FOUND: web/src/lib/schemas.ts (examStart/examEnd in ExamResponse and ExamUpdateRequest)
- FOUND: web/src/app/[tenantSlug]/admin/exams/page.tsx (pageSize/currentPage type)
- FOUND: web/src/app/[tenantSlug]/admin/exams/[examId]/detail/page.tsx (correct field names)
- FOUND: web/src/app/[tenantSlug]/admin/exams/[examId]/edit/page.tsx (correct field names throughout)
- FOUND: web/src/components/admin/exam-detail/ExamBasicInfo.tsx (exam.slug)

Commits verified:
- 4b45d7c: feat(02-01): add examStart/examEnd to ExamResponse and ExamUpdateRequest schemas
- da0faee: fix(02-01): fix exam field name mismatches and pagination type
