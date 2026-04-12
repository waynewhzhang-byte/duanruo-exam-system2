---
phase: 04-reviewer-workflow
plan: "02"
subsystem: reviewer-queue
tags: [frontend, reviewer, queue]
dependency_graph:
  requires: [04-01]
  provides: [reviewer-queue]
  affects:
    - web/src/app/[tenantSlug]/reviewer/queue/page.tsx
tech_stack:
  added: [useExams from api-hooks, Select component]
  patterns: [tenant-context, exam-selector]
key_files:
  modified:
    - web/src/app/[tenantSlug]/reviewer/queue/page.tsx
decisions:
  - Changed API endpoint from /applications/pending-review to /reviews/queue
  - Added exam selector dropdown since /reviews/queue requires examId param
  - Updated approve/reject handlers to use /reviews/decide endpoint
  - Fixed response types to match backend ReviewTaskItem structure
metrics:
  duration: 10 min
  completed: "2026-03-05"
  tasks: 3
  files: 1
---

# Phase 4 Plan 2: Review Queue - Summary

**One-liner:** Fixed review queue to use correct backend API endpoints and added exam selector.

## Completed Tasks

### Task 1: Verify review queue API response handling
- Changed API from `/applications/pending-review` to `/reviews/queue?examId=...&stage=...`
- Added `examId` query parameter requirement (backend requires it)
- Added exam selector dropdown to let reviewer choose which exam's queue to view
- Updated response type from ApplicationPageResponse to ReviewQueueResponse

### Task 2: Verify reviewer role filtering
- Added `stage` parameter: `PRIMARY` for PRIMARY_REVIEWER, `SECONDARY` otherwise
- Queue now correctly filters by reviewer role via stage parameter

### Task 3: Verify list display fields
- Updated to use correct fields from ReviewTaskItem:
  - `applicationId` instead of `applicationNumber`
  - `createdAt` instead of `submittedAt`
- Updated status labels to match backend: PENDING, IN_PROGRESS, COMPLETED

## Key Fixes

1. **API Endpoint**: Changed from `/applications/pending-review` (doesn't exist) to `/reviews/queue`
2. **Exam Selector**: Added because backend requires `examId` parameter
3. **Approve/Reject**: Changed from `/reviews/{id}/approve|reject` to `/reviews/decide`
4. **Data Fields**: Updated to use correct ReviewTaskItem fields

## Backend Gap Identified

The `/reviews/queue` endpoint returns minimal task data without application details (candidate name, position, exam title, etc.). For full display, either:
- Backend needs to enrich queue data, or
- Frontend needs additional API calls to fetch application details

## Next Steps

Proceed to Plan 04-03 to verify review detail page.
