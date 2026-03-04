---
phase: 03-candidate-portal
plan: "01"
subsystem: candidate-applications
tags: [frontend, candidate, tenant-context]
dependency_graph:
  requires: []
  provides: [candidate-applications-list-tenant-context]
  affects: [web/src/app/candidate/applications/page.tsx]
tech_stack:
  added: [useTenant hook]
  patterns: [apiGetWithTenant, tenant-context]
key_files:
  created: []
  modified:
    - web/src/app/candidate/applications/page.tsx
decisions:
  - Use useTenant hook instead of manual tenant selection query
metrics:
  duration: 5 min
  completed: "2026-03-05"
  tasks: 2
  files: 1
---

# Phase 3 Plan 1: Candidate Applications List Fix Summary

**One-liner:** Fixed candidate applications list to use useTenant hook for proper tenant context.

## What Was Built

The candidate applications list page (`/candidate/applications/page.tsx`) was using a manual tenant selection approach with:
- A tenants query to fetch user's associated tenants
- A selectedTenantId state to track selection
- Tenant selector UI component

This was replaced with the standard `useTenant` hook which handles tenant context automatically.

## Tasks Completed

### Task 1: Replace tenant selection with useTenant hook
- **Files:** `web/src/app/candidate/applications/page.tsx`
- Added import for `useTenant` from `@/hooks/useTenant`
- Replaced manual tenant selection with `const { tenant } = useTenant()`
- Removed:
  - `selectedTenantId` state
  - `tenants` query (lines 67-75)
  - Tenant auto-select effect (lines 77-82)
  - Tenant selector UI (lines 214-236)
- Updated queryKey and queryFn to use `tenant?.id` instead of `selectedTenantId`

### Task 2: Fix null check logic
- Changed `if (!tenantsLoading && (!tenants || tenants.length === 0))` to `if (!tenant)`
- Simplified the "no tenant" error state

## Verification Results

1. `npx tsc --noEmit` — passes with no errors
2. `grep useTenant web/src/app/candidate/applications/page.tsx` — confirmed import and usage
3. `grep apiGetWithTenant web/src/app/candidate/applications/page.tsx` — confirmed usage with tenant.id

## Self-Check: PASSED

- [x] useTenant hook imported and used
- [x] apiGetWithTenant uses tenant.id
- [x] Removed manual tenant selection code
- [x] TypeScript passes with 0 errors
