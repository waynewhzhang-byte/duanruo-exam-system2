# Feature Specification: Multi-Tenant SaaS Exam Registration System

**Feature Branch**: `001-exam-registration-saas`
**Created**: 2025-01-19
**Status**: Draft
**Input**: User description: "Multi-tenant SaaS Exam Registration System - Complete platform for exam creation, candidate registration, multi-tier review workflow, payment processing, admission ticket generation, and score management with PostgreSQL schema-based tenant isolation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tenant Onboarding and Exam Creation (Priority: P1)

A SaaS platform super administrator creates a new tenant organization and the tenant administrator sets up their first exam with positions and custom registration forms.

**Why this priority**: This is the foundation - without tenants and exams, no other functionality can work. It establishes the multi-tenant isolation and basic exam structure.

**Independent Test**: Can be fully tested by creating a tenant, verifying schema creation, creating an exam with positions, and confirming data isolation between tenants.

**Acceptance Scenarios**:

1. **Given** super admin is logged in, **When** they create a new tenant with name "ABC Corporation", **Then** system creates a dedicated PostgreSQL schema `tenant_abc_corporation`, initializes default templates, creates object storage namespace, and assigns a tenant administrator
2. **Given** tenant admin is logged in to their tenant, **When** they create an exam with name, registration period, exam date, and fee amount, **Then** exam is saved in tenant schema and appears in tenant's exam list
3. **Given** tenant admin has created an exam, **When** they add positions with job requirements (age 25-35, Bachelor's degree, male/female), **Then** positions are associated with the exam and available for candidate selection
4. **Given** tenant admin is configuring a position, **When** they add subjects (written test, interview, practical test), **Then** subjects are linked to position and define exam components

---

### User Story 2 - Candidate Registration and Auto-Review (Priority: P1)

Candidates register for exams across multiple tenants using a single account, submit applications with document uploads, and receive instant auto-review results based on configured rules.

**Why this priority**: Core value proposition - enables candidates to apply and receive immediate feedback without manual intervention for obvious disqualifications.

**Independent Test**: Create candidate account, apply to exam, upload documents, verify auto-review rules execute correctly, and confirm application status updates.

**Acceptance Scenarios**:

1. **Given** a candidate creates account in public user system, **When** they browse available exams across different tenants, **Then** they see all published exams they're eligible for from all tenants
2. **Given** candidate selects an exam and position, **When** they fill registration form with personal info (name, age 28, Bachelor's degree, ID card) and upload documents (photo, degree certificate), **Then** application is saved with document references to object storage
3. **Given** candidate submits application, **When** auto-review engine executes, **Then** system validates age against position requirement (25-35), checks degree level, verifies mandatory documents uploaded, and sets application status to AUTO_PASSED, AUTO_REJECTED, or PENDING_PRIMARY_REVIEW
4. **Given** candidate has multiple applications across tenants, **When** they view "My Applications", **Then** they see all applications with current status from all tenants in one unified view

---

### User Story 3 - Multi-Tier Manual Review Workflow (Priority: P1)

Human reviewers process applications through primary and secondary review stages, viewing uploaded documents and making approval/rejection decisions.

**Why this priority**: Critical compliance requirement - many exams require human verification of credentials before allowing candidates to proceed.

**Independent Test**: Assign reviewers to exam, submit applications requiring manual review, process through review queues, verify state transitions and audit trail.

**Acceptance Scenarios**:

1. **Given** tenant admin assigns users as PRIMARY_REVIEWER and SECONDARY_REVIEWER for an exam, **When** reviewers log in, **Then** they see queue of applications awaiting their review level
2. **Given** primary reviewer pulls an application from queue, **When** they view application details including uploaded documents (viewable from object storage), **Then** they can approve, reject with reason, or return for candidate resubmission
3. **Given** primary reviewer approves application, **When** application transitions to PENDING_SECONDARY_REVIEW, **Then** secondary reviewer can pull it from their queue for final review
4. **Given** application is returned for resubmission, **When** candidate updates information and resubmits, **Then** application re-enters appropriate review stage
5. **Given** secondary reviewer approves application, **When** status changes to APPROVED, **Then** candidate becomes eligible for payment

---

### User Story 4 - Payment Processing and Ticket Generation (Priority: P2)

Approved candidates pay exam fees through Alipay or WeChat Pay, and upon successful payment, admission tickets are automatically generated with customizable templates.

**Why this priority**: Revenue generation and access control - payment confirms candidate commitment and triggers ticket creation for exam access.

**Independent Test**: Configure payment gateway, process test payment, verify callback handling, confirm ticket generation with custom template, and validate PDF download.

**Acceptance Scenarios**:

1. **Given** candidate application is APPROVED, **When** candidate initiates payment with selected amount, **Then** system generates payment order with Alipay/WeChat Pay and returns payment QR code or deeplink
2. **Given** candidate completes payment, **When** payment gateway sends callback notification with signature, **Then** system verifies signature, updates application status to PAID, and triggers ticket generation
3. **Given** tenant has configured custom ticket template with logo, QR code format, and field positions, **When** ticket is generated for paid application, **Then** PDF uses tenant template with candidate name, ticket number, exam date/time, venue, seat number
4. **Given** ticket is generated, **When** candidate downloads admission ticket, **Then** they receive PDF with QR code containing ticket verification data

---

### User Story 5 - Venue and Seat Allocation (Priority: P2)

After registration closes, administrators configure exam venues and system automatically assigns seats to candidates with preference for grouping by position.

**Why this priority**: Operational requirement - candidates need to know where to take the exam, and proper allocation prevents conflicts and improves exam administration.

**Independent Test**: Create venues with capacity, trigger seat allocation for exam, verify grouping by position, allow manual adjustments, confirm seat assignments appear on tickets.

**Acceptance Scenarios**:

1. **Given** tenant admin configures exam venues with name, address, rooms, and capacity (e.g., Room A101, 50 seats), **When** venues are saved, **Then** they are available for seat allocation
2. **Given** registration period has ended with 500 paid candidates, **When** admin triggers seat allocation with "position-first" strategy, **Then** system groups candidates by position, fills venues sequentially, respects capacity limits
3. **Given** automatic allocation is complete, **When** admin reviews seat assignments, **Then** they can manually swap candidates between seats or reassign to different venues
4. **Given** seat allocation is finalized, **When** system generates updated tickets, **Then** candidates see their assigned venue, room, and seat number on admission ticket

---

### User Story 6 - Score Recording and Interview Eligibility (Priority: P3)

After exams conclude, administrators upload scores via CSV or manual entry, system calculates totals, and determines interview eligibility based on passing thresholds.

**Why this priority**: Post-exam processing - enables candidates to see results and continue to interview stage if qualified.

**Independent Test**: Upload score CSV with mapping, verify score import validation, manually enter scores, confirm total calculation, verify interview eligibility determination.

**Acceptance Scenarios**:

1. **Given** exam is completed, **When** admin uploads CSV with columns (ticket_number, subject_name, score), **Then** system maps fields, validates data format, imports scores, and reports success/failure counts
2. **Given** score import is successful, **When** system calculates total scores per candidate, **Then** candidates see their scores for each subject and overall total
3. **Given** exam has passing threshold of 60 points, **When** candidate scores 75, **Then** application status transitions to INTERVIEW_ELIGIBLE and candidate is notified
4. **Given** candidate scores below threshold, **When** status transitions to WRITTEN_EXAM_FAILED, **Then** candidate sees failure notice and interview stage is not available
5. **Given** admin records interview results, **When** they mark candidate as FINAL_ACCEPTED or FINAL_REJECTED, **Then** recruitment process concludes with final status recorded

---

### Edge Cases

- **What happens when tenant schema creation fails mid-process?** System should rollback tenant record creation and provide error details to super admin without leaving orphaned schemas.

- **How does system handle duplicate applications from same candidate to same exam?** System should prevent multiple applications per candidate per exam, show error message with link to existing application.

- **What if payment callback arrives multiple times for same order?** System should implement idempotent payment processing using transaction ID, processing callback only once and ignoring duplicates.

- **How are concurrent seat allocations handled?** System should lock seat allocation process per exam, preventing simultaneous allocation attempts and ensuring consistency.

- **What happens to uploaded documents if application is deleted?** System should mark documents for async cleanup, maintain references for audit period (e.g., 90 days), then purge from object storage.

- **How does system handle timezone differences for exam dates?** All exam dates/times should be stored and displayed in configured timezone (Asia/Shanghai), with clear timezone indicators on tickets.

- **What if reviewer account is disabled mid-review?** System should release locked applications back to queue and reassign to active reviewers.

## Requirements *(mandatory)*

### Functional Requirements

**Multi-Tenancy & Access Control**

- **FR-001**: System MUST create isolated PostgreSQL schema for each tenant with naming pattern `tenant_{code}` upon tenant creation
- **FR-002**: System MUST store global user accounts, tenant registry, and user-tenant-role mappings in public schema separate from tenant data
- **FR-003**: System MUST validate user belongs to requested tenant via user_tenant_roles table before allowing access to tenant-scoped resources
- **FR-004**: System MUST allow SUPER_ADMIN role to access any tenant for platform administration
- **FR-005**: System MUST initialize MinIO/S3 storage namespace for each tenant upon creation
- **FR-006**: System MUST run database migrations for new tenant schemas using tenant-specific migration scripts

**User Management & Authentication**

- **FR-007**: System MUST support single sign-on allowing one user account to access multiple tenant exams
- **FR-008**: System MUST assign roles at tenant level: SUPER_ADMIN (global), TENANT_ADMIN, PRIMARY_REVIEWER, SECONDARY_REVIEWER, CANDIDATE
- **FR-009**: System MUST automatically assign CANDIDATE role to user when they submit first application to a tenant
- **FR-010**: System MUST allow tenant admins to assign reviewer roles to users within their tenant

**Exam & Position Management**

- **FR-011**: Tenant admins MUST be able to create exams with title, registration period (start/end dates), exam date, location, and fee amount
- **FR-012**: Tenant admins MUST be able to add positions to exams with job title, hiring count, and requirements (age range, gender, education level)
- **FR-013**: Tenant admins MUST be able to add subjects to positions with subject type (WRITTEN, INTERVIEW, PRACTICAL, PHYSICAL) and passing scores
- **FR-014**: System MUST support custom registration form templates per exam with field types: text, number, select, date, file upload
- **FR-015**: System MUST allow tenant admins to configure auto-review rules per exam based on age, gender, education, and required documents

**Application Submission**

- **FR-016**: Candidates MUST be able to browse published exams across all tenants and filter by date, location, position
- **FR-017**: Candidates MUST be able to submit applications with form data and document uploads to object storage
- **FR-018**: System MUST prevent duplicate applications from same candidate to same exam
- **FR-019**: System MUST validate file uploads for type (PDF, JPG, PNG, DOC), size (max 10MB), and virus scan status before accepting
- **FR-020**: System MUST generate presigned URLs for direct file upload to object storage, storing metadata in tenant schema

**Auto-Review Engine**

- **FR-021**: System MUST execute auto-review rules immediately upon application submission
- **FR-022**: Auto-review MUST validate age within position requirements (e.g., 25-35 years old)
- **FR-023**: Auto-review MUST validate gender matches position restrictions if specified
- **FR-024**: Auto-review MUST validate education level meets or exceeds position minimum (e.g., Bachelor's degree required)
- **FR-025**: Auto-review MUST validate all mandatory documents are uploaded
- **FR-026**: System MUST transition application to AUTO_PASSED (all rules pass), AUTO_REJECTED (any rule fails), or PENDING_PRIMARY_REVIEW (manual review required)
- **FR-027**: System MUST store auto-review results as JSON including which rules passed/failed with details

**Manual Review Workflow**

- **FR-028**: System MUST provide review queue for PRIMARY_REVIEWER and SECONDARY_REVIEWER showing applications awaiting their review level
- **FR-029**: Reviewers MUST be able to pull application from queue, which locks it to prevent concurrent review
- **FR-030**: System MUST display application form data, uploaded documents (viewable from object storage), and auto-review results to reviewer
- **FR-031**: Reviewers MUST be able to approve, reject with reason, or return application for candidate resubmission
- **FR-032**: System MUST implement review heartbeat mechanism - if reviewer doesn't act within timeout (30 minutes), release application back to queue
- **FR-033**: System MUST transition approved primary review to PENDING_SECONDARY_REVIEW for final approval
- **FR-034**: System MUST allow secondary reviewer to perform final approval, transitioning to APPROVED status
- **FR-035**: Candidates MUST be able to update and resubmit applications marked as RETURNED_FOR_RESUBMISSION

**Payment Processing**

- **FR-036**: System MUST integrate with Alipay and WeChat Pay for exam fee collection
- **FR-037**: System MUST generate unique payment order ID for each payment attempt
- **FR-038**: System MUST verify payment callback signatures using HMAC-SHA256 to prevent fraud
- **FR-039**: System MUST process payment callbacks idempotently using transaction ID to handle duplicate notifications
- **FR-040**: System MUST transition application status from APPROVED to PAID upon successful payment verification
- **FR-041**: System MUST trigger admission ticket generation automatically after payment confirmation

**Admission Ticket System**

- **FR-042**: Tenant admins MUST be able to configure ticket templates with logo, QR code format, field positions, and custom text
- **FR-043**: System MUST generate unique ticket numbers using configurable rules (prefix, sequence number, exam code)
- **FR-044**: System MUST generate admission tickets as PDF files including candidate name, ticket number, photo, exam date/time, venue, seat number
- **FR-045**: System MUST embed QR code in ticket containing ticket verification data
- **FR-046**: Candidates MUST be able to download and print admission tickets after payment
- **FR-047**: System MUST update tickets with venue and seat information after allocation is complete

**Venue & Seat Allocation**

- **FR-048**: Tenant admins MUST be able to configure exam venues with name, address, rooms, and capacity per room
- **FR-049**: System MUST support automatic seat allocation with strategies: position-first (group by position), random, submitted-time-first
- **FR-050**: System MUST respect venue capacity limits during allocation, showing error if insufficient seats
- **FR-051**: Tenant admins MUST be able to manually adjust seat assignments after automatic allocation
- **FR-052**: System MUST prevent seat allocation modifications after finalization to maintain data integrity
- **FR-053**: System MUST notify candidates of seat assignments via notification system

**Score Management**

- **FR-054**: System MUST support CSV score import with field mapping (ticket number, name, subject, score)
- **FR-055**: System MUST validate imported scores for data type, score range (0-100), and matching ticket numbers
- **FR-056**: System MUST allow manual score entry and editing by authorized users
- **FR-057**: System MUST calculate total scores by summing subject scores per candidate
- **FR-058**: System MUST determine interview eligibility by comparing total score against configured passing threshold
- **FR-059**: System MUST transition applications to INTERVIEW_ELIGIBLE or WRITTEN_EXAM_FAILED based on scores
- **FR-060**: System MUST allow recording interview results with outcome (FINAL_ACCEPTED, FINAL_REJECTED) and notes

**Audit & Compliance**

- **FR-061**: System MUST log all state-changing operations to audit_logs table including user ID, tenant ID, action, timestamp, IP address
- **FR-062**: System MUST encrypt PII data (ID card numbers, phone numbers) using AES encryption before storage
- **FR-063**: System MUST provide audit trail query capability for compliance verification
- **FR-064**: System MUST maintain document retention policy, preserving uploaded files for configured period (default 90 days post-exam)

### Key Entities

- **Tenant**: Represents customer organization, has unique code, name, schema name, status (active/inactive), storage namespace
- **User**: Global user account in public schema, has username, email, password hash, can belong to multiple tenants with different roles
- **UserTenantRole**: Links users to tenants with specific roles, defines access permissions within tenant context
- **Exam**: Tenant-scoped exam definition, has title, registration period, exam date, location, fee amount, review rules, form template, status (DRAFT, OPEN, CLOSED, IN_PROGRESS, COMPLETED)
- **Position**: Job position within exam, has title, hiring count, requirements (age range, gender, education level), belongs to exam
- **Subject**: Exam subject within position, has type (WRITTEN, INTERVIEW, PRACTICAL, PHYSICAL), passing score, exam time/date
- **Application**: Candidate application to exam position, has status (DRAFT, SUBMITTED, AUTO_PASSED, PENDING_PRIMARY_REVIEW, APPROVED, PAID, TICKET_ISSUED, etc.), form payload (JSON), auto-review result (JSON), review history
- **ApplicationAttachment**: Uploaded document reference, links to application and form field, stores object storage URL, file metadata
- **ApplicationReview**: Review decision record, links reviewer to application, contains decision (APPROVE, REJECT, RETURN), reason, timestamp
- **Payment**: Payment transaction record, has application ID, amount, channel (ALIPAY, WECHAT), transaction ID, status, callback timestamp
- **AdmissionTicket**: Generated ticket for paid application, has ticket number, PDF file URL, QR code data, generated timestamp
- **Venue**: Exam venue definition, has name, address, tenant association
- **Room**: Exam room within venue, has room identifier, capacity
- **SeatAssignment**: Links application to specific seat in room, has allocation strategy metadata
- **ExamScore**: Score record per application and subject, has score value, graded by user ID, graded timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Super admin can create new tenant and assign tenant admin in under 3 minutes with automatic schema creation completing within 10 seconds
- **SC-002**: Tenant admin can configure complete exam with 10 positions and custom form template in under 30 minutes
- **SC-003**: System supports 100,000 concurrent candidate applications without performance degradation (response time < 500ms for 95th percentile)
- **SC-004**: Auto-review engine processes and returns decision for each application within 2 seconds of submission
- **SC-005**: Payment callback processing completes within 3 seconds with idempotent handling preventing duplicate payments
- **SC-006**: Admission ticket PDF generation completes within 5 seconds per ticket, with batch generation of 10,000 tickets completing within 10 minutes
- **SC-007**: Seat allocation for 50,000 candidates across 100 venues completes within 5 minutes using position-first strategy
- **SC-008**: CSV score import of 10,000 records completes within 2 minutes with detailed validation error report
- **SC-009**: Data isolation is verified - zero cross-tenant data leaks in security testing with 100% of queries scoped to correct schema
- **SC-010**: 95% of candidates successfully complete registration and payment flow on first attempt without support assistance
- **SC-011**: Reviewer productivity: each reviewer processes average of 50 applications per hour with complete document viewing
- **SC-012**: System achieves 99.9% uptime during peak registration periods with automated failover and recovery

## Assumptions *(document reasonable defaults)*

### Infrastructure Assumptions
- PostgreSQL 15+ database is available with sufficient capacity for schema-per-tenant model (estimated 100-500 tenants initially)
- MinIO or S3-compatible object storage is configured with multi-region replication for file durability
- Network bandwidth supports file uploads of 10MB per document with 1000 concurrent uploads
- CDN or reverse proxy handles static content delivery for admission ticket PDF downloads

### Business Rule Assumptions
- Default passing score threshold is 60 points (configurable per exam)
- Auto-review rules are AND-combined (all must pass to auto-approve)
- Manual review is sequential (primary then secondary) with no skip option
- Payment must be completed within 7 days of approval (configurable)
- Seat allocation can be performed only once per exam (manual adjustments allowed before finalization)
- Interview eligibility is binary (eligible or not) based solely on written exam total score
- Tenant schema retention after tenant deletion is 90 days for compliance/recovery

### User Experience Assumptions
- Primary user interface language is Simplified Chinese with English as secondary language
- Date/time displayed in Asia/Shanghai timezone (GMT+8) with explicit timezone labels
- Notifications are sent via email by default (SMS optional upgrade feature)
- Candidates can save draft applications and return later before submission
- Uploaded documents are viewable directly in browser (PDF, images) without requiring download

### Integration Assumptions
- Alipay and WeChat Pay APIs are accessed via official SDKs with sandbox environments for testing
- Payment gateway callbacks arrive within 30 seconds of payment completion (99.9% of cases)
- Object storage presigned URLs expire after 1 hour requiring regeneration for extended viewing
- Email delivery service has 95% delivery rate within 5 minutes
- QR code readers on admission tickets can scan standard QR code format (version 10, error correction L)

### Security & Compliance Assumptions
- PII encryption keys are rotated quarterly following key management best practices
- Audit logs are retained for 7 years to meet typical compliance requirements
- File virus scanning completes within 10 seconds per file (using ClamAV or equivalent)
- HTTPS/TLS 1.3 is enforced for all API communications
- User passwords are hashed with bcrypt (cost factor 12) before storage

### Scalability Assumptions
- System scales horizontally with additional application servers behind load balancer
- Database connection pool sized for 20 connections per app server instance
- Object storage scales automatically with usage without manual intervention
- Seat allocation algorithm is optimized for O(n log n) complexity handling 100k+ candidates
- Review queues use database-backed job queue with optimistic locking to prevent race conditions

## Out of Scope *(clarify boundaries)*

The following features are **NOT** included in this specification:

- **Mobile Applications**: Native iOS/Android apps (web interface is responsive for mobile browsers)
- **AI-Powered Resume Screening**: Automatic resume parsing and candidate ranking based on machine learning
- **Video Interview Integration**: Built-in video conferencing for remote interviews
- **Background Check Integration**: Third-party background verification services
- **Exam Content Management**: Question bank creation, exam paper generation, or online testing platform
- **Biometric Verification**: Fingerprint or facial recognition for identity verification at exam venues
- **Real-Time Proctoring**: Live monitoring of candidates during exams via webcam
- **Multi-Currency Payments**: International payment methods beyond Alipay and WeChat Pay
- **Blockchain Certification**: Immutable certification records on blockchain
- **Social Media Integration**: Candidate profile import from LinkedIn or other social platforms
- **Advanced Analytics Dashboard**: Business intelligence with predictive analytics and trend forecasting
- **White-Label Customization**: Complete UI/branding customization per tenant (basic logo/color customization is in scope)
- **API Marketplace**: Third-party developer ecosystem with public APIs
- **Candidate Talent Pool**: Long-term candidate database beyond current exam cycle

These features may be considered for future phases but are not required for MVP launch.

## Dependencies & Prerequisites

### External Service Dependencies
- PostgreSQL 15+ database cluster with high availability configuration
- MinIO or AWS S3 for object storage (with versioning enabled)
- Alipay Payment Gateway account with production credentials
- WeChat Pay merchant account with API credentials
- SMTP email service (SendGrid, AWS SES, or equivalent) with 10,000 emails/month minimum
- (Optional) SMS gateway for notification enhancement
- (Optional) ClamAV or commercial virus scanning service for file uploads

### Technical Prerequisites
- TLS/SSL certificates for all domains (wildcard certificate for multi-tenant subdomains)
- CDN configuration for static asset delivery and PDF downloads
- Monitoring and alerting infrastructure (Prometheus, Grafana, or equivalent)
- Log aggregation system (ELK stack, Splunk, or equivalent)
- Backup automation system with point-in-time recovery capability for database and object storage
- Load balancer configuration for horizontal scaling (Nginx, HAProxy, or cloud ALB)

### Operational Prerequisites
- DevOps team trained on multi-tenant schema management and deployment procedures
- Customer support team trained on tenant onboarding and troubleshooting workflows
- Database administrator available for schema migration reviews and performance tuning
- Security team review and approval of encryption key management procedures
- Legal review of data retention policies and compliance requirements
- Payment gateway testing environment access for integration testing

## Version History

| Version | Date       | Changes                            | Author      |
| ------- | ---------- | ---------------------------------- | ----------- |
| 1.0     | 2025-01-19 | Initial specification creation     | Claude Code |
