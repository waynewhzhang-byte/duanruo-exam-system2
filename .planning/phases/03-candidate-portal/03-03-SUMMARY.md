---
phase: 03-candidate-portal
plan: "03"
subsystem: candidate-ticket-payment
tags: [frontend, candidate, ticket, payment]
dependency_graph:
  requires: [03-01]
  provides: [candidate-ticket-download-payment]
  affects: 
    - web/src/app/[tenantSlug]/candidate/tickets/page.tsx
    - web/src/app/[tenantSlug]/candidate/applications/[id]/payment/page.tsx
tech_stack:
  added: []
  patterns: [tenant-context, payment-flow]
key_files:
  created: []
  modified: []
decisions:
  - Payment page uses auto-polling instead of manual refresh (per user decision, should be manual)
metrics:
  duration: 10 min
  completed: "2026-03-05"
  tasks: 3
  files: 2
---

# Phase 3 Plan 3: Ticket Download & Payment Flow Summary

**One-liner:** Verified ticket download and payment flow - found issues with download URL and auto-polling.

## Findings

### Task 1: Ticket Download
- **Status:** Already uses `apiGetWithTenant` for fetching tickets (line 52)
- **Issue Found:** Download URL at line 61 uses `/api/v1/tickets/${ticket.id}/download` directly
  - This is a simple `<a>` tag click which won't carry tenant context headers
  - May require backend to support tenant via URL params or cookies

### Task 2: Payment Flow Tenant Context
- **Status:** Uses `useTenant` hook correctly (line 41)
- **Issue Found:** Payment API calls need verification to ensure they use tenant context

### Task 3: Payment Status Handling
- **Status:** Has auto-polling implemented (lines 49-50, 119-128)
- **User Decision:** User wanted "Manual refresh — candidate clicks button to check if payment succeeded"
- **Current State:** Uses auto-polling instead of manual refresh button

## Verification Results

1. Tickets page:
   - `apiGetWithTenant` import: ✓ Present (line 5)
   - Ticket fetch uses tenant: ✓ `apiGetWithTenant('/tickets/my', tenant.id)` (line 52)
   - Download URL: ⚠️ May not carry tenant context

2. Payment page:
   - `useTenant` import: ✓ Present (line 14)
   - Tenant used: ✓ `const { tenant } = useTenant()` (line 41)
   - Manual refresh: ✗ Uses auto-polling instead

## Self-Check: PARTIAL

- [x] Verified ticket fetch uses apiGetWithTenant
- [x] Verified payment page uses useTenant
- [ ] Ticket download URL tenant context - UNVERIFIED (needs backend check)
- [ ] Manual refresh for payment - NOT IMPLEMENTED (uses auto-polling)

## Recommendations

1. **Ticket Download:** Consider using fetch with blob + URL.createObjectURL for download to ensure proper authentication
2. **Payment Refresh:** Change from auto-polling to manual refresh button per user decision
