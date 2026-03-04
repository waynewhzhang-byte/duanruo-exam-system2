---
phase: 02-admin-backend
plan: "05"
subsystem: admin-exam-list
tags: [frontend, exam-list, field-fix]
dependency_graph:
  requires: [02-01]
  provides: [exam-list-examStart-examEnd]
  affects: [web/src/app/[tenantSlug]/admin/exams/page.tsx]
tech_stack:
  added: []
  patterns: [examStart-examEnd-field-alignment]
key_files:
  created: []
  modified:
    - web/src/app/[tenantSlug]/admin/exams/page.tsx
decisions:
  - Use examStart ~ examEnd format to display exam time range
metrics:
  duration: 2 min
  completed: "2026-03-05"
  tasks: 1
  files: 1
---

# Phase 2 Plan 5: Exam List Page ExamStart/ExamEnd Fix Summary

**One-liner:** Fixed exam list page Exam interface to use examStart/examEnd instead of examDate.

## What Was Built

The exam list page (`/[tenantSlug]/admin/exams`) had incorrect field name in its local `Exam` interface. The interface used `examDate?: string` which is never populated by the backend (which returns `examStart`/`examEnd`), causing the exam time column to always display "未设置" for every exam.

## Tasks Completed

### Task 1: Fix Exam interface and JSX in exams/page.tsx
- **Files:** `web/src/app/[tenantSlug]/admin/exams/page.tsx`
- Changed `Exam` interface from `examDate?: string` to `examStart?: string` and `examEnd?: string`
- Updated JSX to render `{exam.examStart || '未设置'} ~ {exam.examEnd || '未设置'}`

## Verification Results

1. `grep examDate web/src/app/[tenantSlug]/admin/exams/page.tsx` — returns nothing (wrong field removed)
2. `grep examStart|examEnd web/src/app/[tenantSlug]/admin/exams/page.tsx` — shows correct fields at lines 36-37 and 395
3. `npx tsc --noEmit` — passes with no errors

## Self-Check: PASSED

- [x] `Exam` interface contains `examStart?: string` and `examEnd?: string` (no `examDate`)
- [x] JSX at the exam time row renders `exam.examStart` and `exam.examEnd`
- [x] TypeScript type-check passes
