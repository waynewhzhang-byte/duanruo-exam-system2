---
status: testing
phase: 01-api-foundation
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md]
started: 2026-03-05T00:00:00Z
updated: 2026-03-05T00:00:00Z
---

## Current Test

number: 2
name: Validation error messages are readable
expected: |
  On any form (e.g. create exam), submit with some required fields left empty.
  The page should display specific field error messages like "name must not be empty"
  rather than "[object Object]" or a generic error.
awaiting: user response

## Tests

### 1. X-Tenant-ID header on API requests
expected: Open DevTools Network tab, navigate to any tenant page (e.g. /{tenantSlug}/admin/exams). Every API request to /api/v1/... should have an X-Tenant-ID request header with the tenant UUID value.
result: pass

### 2. Validation error messages are readable
expected: On any form (e.g. create exam), submit with some required fields left empty. The page should display specific field error messages like "name must not be empty" rather than "[object Object]" or a generic error.
result: [pending]

### 3. Expired token auto-redirects to login
expected: With an expired or invalid auth token (clear auth-token cookie then try to navigate to an admin page), the browser should automatically redirect to /login?redirect=<previous-path> instead of showing a broken/empty page.
result: [pending]

### 4. 403 permission error shows toast
expected: If a user without the required permission triggers a 403 response (e.g. a candidate trying to access an admin endpoint), a red toast notification should appear saying "权限不足" (Insufficient permissions).
result: [pending]

## Summary

total: 4
passed: 1
issues: 0
pending: 3
skipped: 0

## Gaps

[none yet]
