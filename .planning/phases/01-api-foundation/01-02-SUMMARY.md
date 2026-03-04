---
phase: 01-api-foundation
plan: "02"
subsystem: frontend-api
tags: [react-query, error-handling, auth, toast, api-client]
dependency_graph:
  requires: [01-01]
  provides: [global-401-redirect, global-403-toast, response-unwrapping-contract]
  affects: [all-authenticated-pages]
tech_stack:
  added: []
  patterns: [react-query-global-error-handler, cache-config-onError]
key_files:
  created: []
  modified:
    - web/src/components/providers/QueryProvider.tsx
    - web/src/lib/api.ts
decisions:
  - "Use queryClient.getQueryCache().config.onError and getMutationCache().config.onError for global error handling (React Query v5 pattern — avoids deprecated QueryClient constructor onError)"
  - "Use window.location.href (not Next.js router) for 401 redirect since handler runs outside React component lifecycle"
  - "Guard redirect with pathname !== '/login' check to prevent redirect loops"
metrics:
  duration: "2 min"
  completed: "2026-03-04"
  tasks_completed: 2
  files_modified: 2
---

# Phase 01 Plan 02: Global API Error Handling Summary

**One-liner:** React Query global error handler — 401 auto-redirects to /login with ?redirect= param, 403 shows destructive "权限不足" toast via cache config.onError pattern.

## What Was Built

Added global cross-cutting error handling to the React Query client so that expired sessions and permission errors produce actionable user feedback instead of leaving pages broken and empty.

### Task 1: Global 401/403 error handlers in QueryProvider

**File:** `web/src/components/providers/QueryProvider.tsx`

Added a `handleGlobalError(error: unknown)` function and attached it to both `queryClient.getQueryCache().config.onError` and `queryClient.getMutationCache().config.onError`.

The handler:
- Checks if `error` is an `APIError` instance (does nothing for non-API errors)
- On `isUnauthorized` (401): redirects to `/login?redirect=<encoded-current-path>` via `window.location.href`, but only when `window.location.pathname !== '/login'` to avoid redirect loops
- On `isForbidden` (403): calls `toast({ title: '权限不足', description: ..., variant: 'destructive' })`

Imports added: `APIError` from `@/lib/api`, `toast` from `@/components/ui/use-toast`.

### Task 2: Response unwrapping audit and documentation (API-02)

**File:** `web/src/lib/api.ts`

Audited all three response unwrapping paths against the `TransformInterceptor` backend contract (`{ success: true, data: T, timestamp: string }`):

1. **Schema path** (lines 168-171): Correctly extracts `data.data` before `schema.parse`. No change needed.
2. **Non-schema path** (lines 175-177): Correctly returns `data.data`. No change needed.
3. **Raw return** (line 179): Correctly returns `data` directly for endpoints bypassing the interceptor (e.g., file streams). No change needed.

Added comment block documenting the TransformInterceptor contract above the unwrapping logic.

## Success Criteria Verification

- `QueryProvider.tsx` type-checks cleanly: PASSED
- Global 401 handler redirects to `/login?redirect=...` via `window.location.href`: VERIFIED
- Global 403 handler calls `toast()` with `variant: 'destructive'` and "权限不足" title: VERIFIED
- `api.ts` has comment documenting TransformInterceptor unwrapping contract: VERIFIED
- Response unwrapping logic correctly handles `{ success, data, timestamp }` format: VERIFIED (all 3 paths confirmed correct)

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | 9af2128 | feat(01-02): add global 401/403 error handlers to QueryProvider |
| 2    | 207dac5 | docs(01-02): document TransformInterceptor response unwrapping contract in api.ts |

## Self-Check: PASSED
