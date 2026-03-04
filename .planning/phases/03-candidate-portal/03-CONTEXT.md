# Phase 3: Candidate Portal - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Candidate-facing portal where candidates can: find exams, submit applications (with form and file uploads), pay exam fees, and download admission tickets. This is about fixing the existing candidate flow — not building from scratch.

</domain>

<decisions>
## Implementation Decisions

### Application Form Fields & File Upload
- **Form fields:** Template-driven — form fields are defined by each exam's `formTemplate` configuration
- **File upload:** Per-field upload — one file per required field (ID photo, certificate, etc.) with clear labels
- **Position selection:** Single position — candidate applies to one position per application
- **Draft support:** Auto-save draft every 30 seconds to prevent data loss

### Application Status Display
- **Status UI:** Progress stepper showing: Draft → Submitted → Paid → Under Review → Approved → Ticket Issued
- **Card design:** Detailed cards showing: exam name, position, submission date, current status
- **Visual encoding:** Color-coded by status (Green=success, Yellow=pending, Red=rejected, Gray=draft)
- **Actions:** Context-sensitive — buttons change based on status (Draft: Continue editing, Submitted: View only, Approved: Download ticket)

### Ticket Download Flow
- **Format:** PDF download
- **Trigger:** Prominent "Download Ticket" button displayed when ticket is available
- **Content:** Full details — candidate name, photo, ID number, exam name, position, date/time, venue, room, seat number
- **Verification:** Ticket number only (no QR code required)

### Payment Flow & UI
- **Method:** External payment gateway (Alipay/WeChat Pay-style redirect)
- **Presentation:** Inline payment — payment status shown in application card, click to pay
- **Status update:** Manual refresh — candidate clicks button to check if payment succeeded
- **Failure handling:** Show payment amount + retry button

### Claude's Discretion
- Exact field validation rules (from formTemplate schema)
- Loading states and error handling details
- Specific colors for status badges
- PDF layout and typography

</decisions>

<specifics>
## Specific Ideas

- Form fields are dynamically rendered based on exam's `formTemplate` JSON configuration
- Status stepper provides clear visual progress indication
- Inline payment keeps candidate in context without page navigation

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-candidate-portal*
*Context gathered: 2026-03-05*
