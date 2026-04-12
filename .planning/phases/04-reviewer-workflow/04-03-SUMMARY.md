---
phase: 04-reviewer-workflow
plan: "03"
subsystem: reviewer-detail
tags: [frontend, reviewer, detail]
dependency_graph:
  requires: [04-01]
  provides: [reviewer-detail]
  affects:
    - web/src/app/[tenantSlug]/reviewer/applications/[id]/page.tsx
tech_stack:
  added: []
  patterns: [tenant-context]
key_files:
  modified:
    - web/src/app/[tenantSlug]/reviewer/applications/[id]/page.tsx
decisions:
  - Approve/reject mutations throw errors - need backend enhancement
  - Query key updated from pending-review-applications to review-queue
metrics:
  duration: 5 min
  completed: "2026-03-05"
  tasks: 5
  files: 1
---

# Phase 4 Plan 3: Review Detail - Summary

**One-liner:** Verified review detail page but found critical API gaps.

## Completed Tasks

### Task 1: Verify application detail loads correctly
- Detail page uses correct endpoint: `GET /applications/{id}`
- Uses apiGetWithTenant for tenant context
- Response type matches ApplicationDetailResponse

### Task 2: Verify candidate information display
- Displays: candidateName, candidateIdCardNumber, candidatePhone, candidateEmail
- Uses form template for field labels
- Falls back to default labels

### Task 3: Verify attachment display and preview
- Shows attachments list with fileName, contentType, fileSize
- Preview button calls `/files/{fileId}/download-url`
- Modal displays preview in iframe

### Task 4: Verify approve action
- **BROKEN**: Endpoint `/reviews/{id}/approve` doesn't exist
- Should use `/reviews/decide` but requires taskId
- Backend doesn't return taskId with application detail

### Task 5: Verify reject action  
- **BROKEN**: Endpoint `/reviews/{id}/reject` doesn't exist
- Same issue as approve - needs taskId from backend

## Critical Backend Gap

The review actions require `taskId` but:
1. Application detail endpoint doesn't return associated taskId
2. Review decide endpoint requires taskId (not applicationId)
3. Frontend cannot perform approve/reject without backend changes

## Temporary Workaround

Approve/reject mutations now throw descriptive errors indicating backend enhancement is needed:
```
'Review action requires taskId - backend enhancement needed'
```

## Summary

- ✅ Application detail loads correctly
- ✅ Candidate info displays correctly  
- ✅ Attach preview works
-ments display and ❌ Approve action broken (needs taskId)
- ❌ Reject action broken (needs taskId)

**Backend enhancement required** before review actions can work.
