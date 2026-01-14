# Data Model – Multi-Tenant SaaS Exam Registration System

> Source of truth: `specs/001-exam-registration-saas/spec.md` (User Stories, Functional Requirements, Key Entities)  
> Scope: Tenant-scoped schemas (`tenant_{code}`) plus public schema for shared data. All PKs are BIGSERIAL unless noted; timestamps use `TIMESTAMP WITH TIME ZONE` defaulting to `now()`.

## Public Schema Entities

### Tenant
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL | Primary key |
| code | VARCHAR(64) UNIQUE | Used to derive schema name `tenant_{code}` |
| name | VARCHAR(255) | Display name |
| status | ENUM(ACTIVE, SUSPENDED) | Controls login + schema routing |
| schema_name | VARCHAR(128) | Physical schema |
| storage_namespace | VARCHAR(255) | MinIO bucket prefix |
| config | JSONB | Feature toggles, branding |
| created_at / updated_at | TIMESTAMP | Audit columns |

### User
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL |
| username | VARCHAR(128) UNIQUE |
| email | VARCHAR(255) UNIQUE |
| password_hash | VARCHAR(255) | bcrypt with cost 12 |
| phone | VARCHAR(32) | AES-encrypted at rest |
| real_name | VARCHAR(128) | AES-encrypted |
| id_card | VARCHAR(32) | AES-encrypted, validated |
| status | ENUM(ACTIVE, LOCKED) |
| created_at / updated_at | TIMESTAMP |

### UserTenantRole
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL |
| user_id | FK → User.id |
| tenant_id | FK → Tenant.id |
| role | ENUM(SUPER_ADMIN, TENANT_ADMIN, PRIMARY_REVIEWER, SECONDARY_REVIEWER, CANDIDATE) |
| created_at | TIMESTAMP |

## Tenant Schema Entities

### Exam
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL |
| title | VARCHAR(255) |
| registration_start / registration_end | TIMESTAMP |
| exam_date | TIMESTAMP |
| location | VARCHAR(255) |
| fee_amount | NUMERIC(12,2) |
| status | ENUM(DRAFT, OPEN, CLOSED, IN_PROGRESS, COMPLETED) |
| review_rules | JSONB | Auto-review config |
| form_template | JSONB | Custom registration form definition |
| created_by | BIGINT | FK → User.id (public schema, stored via cross-schema ID) |
| created_at / updated_at | TIMESTAMP |

### Position
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL |
| exam_id | FK → Exam.id |
| title | VARCHAR(255) |
| hiring_count | INT |
| age_min / age_max | SMALLINT |
| gender_requirement | ENUM(MALE, FEMALE, ANY) |
| education_requirement | ENUM(DIPLOMA, BACHELOR, MASTER, DOCTORATE) |
| description | TEXT |

### Subject
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL |
| position_id | FK → Position.id |
| type | ENUM(WRITTEN, INTERVIEW, PRACTICAL, PHYSICAL) |
| passing_score | SMALLINT |
| scheduled_at | TIMESTAMP |

### Application
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL |
| exam_id | FK → Exam.id |
| position_id | FK → Position.id |
| user_id | BIGINT | References public schema user |
| registration_no | VARCHAR(64) UNIQUE |
| status | ENUM(DRAFT, SUBMITTED, AUTO_PASSED, AUTO_REJECTED, PENDING_PRIMARY_REVIEW, PENDING_SECONDARY_REVIEW, APPROVED, RETURNED_FOR_RESUBMISSION, PAID, TICKET_ISSUED, INTERVIEW_ELIGIBLE, WRITTEN_EXAM_FAILED, FINAL_ACCEPTED, FINAL_REJECTED) |
| form_payload | JSONB | Custom answers |
| auto_review_result | JSONB |
| review_locked_by | BIGINT NULL | Reviewer currently holding record |
| review_lock_expires_at | TIMESTAMP |
| created_at / updated_at | TIMESTAMP |

### ApplicationAttachment
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL |
| application_id | FK → Application.id |
| field_key | VARCHAR(128) |
| object_key | VARCHAR(255) | MinIO path |
| file_name | VARCHAR(255) |
| file_type | ENUM(PDF, JPG, PNG, DOC) |
| file_size | INT |
| virus_scan_status | ENUM(PENDING, PASSED, FAILED) |
| uploaded_at | TIMESTAMP |

### ApplicationReview
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL |
| application_id | FK → Application.id |
| reviewer_id | BIGINT | Public schema User ID |
| level | ENUM(PRIMARY, SECONDARY) |
| decision | ENUM(APPROVE, REJECT, RETURN) |
| reason | TEXT |
| decided_at | TIMESTAMP |

### PaymentRecord
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL |
| application_id | FK → Application.id |
| channel | ENUM(ALIPAY, WECHAT) |
| order_no | VARCHAR(64) UNIQUE |
| transaction_id | VARCHAR(64) UNIQUE |
| amount | NUMERIC(12,2) |
| status | ENUM(PENDING, SUCCESS, FAILED) |
| callback_payload | JSONB |
| paid_at | TIMESTAMP |

### AdmissionTicket
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL |
| application_id | FK → Application.id |
| ticket_no | VARCHAR(64) UNIQUE |
| pdf_path | VARCHAR(255) |
| qr_code_payload | JSONB |
| generated_at | TIMESTAMP |

### Venue / Room / SeatAssignment

- **Venue**
  - Fields: id, name, address, contact, notes
- **Room**
  - Fields: id, venue_id, room_name, capacity, exam_date_slot
- **SeatAssignment**
  - Fields: id, exam_id, room_id, application_id, seat_no, allocation_strategy, locked (bool), assigned_at

### ExamScore
| Field | Type | Notes |
|-------|------|-------|
| id | BIGSERIAL |
| application_id | FK → Application.id |
| subject_id | FK → Subject.id |
| score | NUMERIC(5,2) |
| graded_by | BIGINT |
| graded_at | TIMESTAMP |
| is_qualified | BOOLEAN |

## Relationships & State Notes

- `Exam` 1—N `Position` → 1—N `Subject`.
- `Application` references `Exam`, `Position`, `User`. Duplicate prevention enforced via unique `(exam_id, user_id)`.
- `ApplicationReview` records state transitions; application status machine follows spec (Draft → Submitted → Auto → Manual → Payment → Ticket → Score).
- `SeatAssignment` references `Application` only after payment and approved seat allocation.
- `AdmissionTicket` references `SeatAssignment` to embed venue/room/seat.
- `ExamScore` uses `subject_id` to report per subject + aggregated totals.

All entities inherit audit columns (`created_at`, `updated_at`, `created_by`, `updated_by`, `is_deleted`, `version`) per repository convention even if not repeated in every table above.

