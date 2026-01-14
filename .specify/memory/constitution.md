<!--
Sync Impact Report
- Version: 0.0.0 → 1.0.0
- Modified principles: N/A (initial issue)
- Added sections: Core Principles, Operational Guardrails, Workflow Expectations, Governance
- Removed sections: None
- Templates requiring updates:
  - ✅ .specify/templates/spec-template.md (no changes needed; already compatible)
  - ✅ .specify/templates/plan-template.md (no changes needed; Constitution Check references remain valid)
  - ✅ .specify/templates/tasks-template.md (no changes needed; task categories already cover new guardrails)
- Follow-up TODOs: None
-->

# Exam Registration SaaS Constitution

## Core Principles

### I. Tenant Isolation & RBAC Enforcement
Every artifact (spec, plan, implementation) MUST preserve schema-per-tenant isolation and role-based access control. Never mix public-schema data with tenant data, and every endpoint or UI flow must state how tenancy and RBAC are enforced. Cross-tenant reads/writes are prohibited unless explicitly authorized for SUPER_ADMIN.

### II. DDD Boundaries & Clean Ports
Domain models stay framework-free. All dependencies cross layers via ports/adapters. Plans/tasks must cite which layer they touch, and no persistence, HTTP, or cloud SDK appears inside the domain layer. Shared abstractions live in `exam-shared` only when reused by two or more bounded contexts.

### III. Security & PII Protection (NON-NEGOTIABLE)
PII (ID numbers, phone, education docs) must be encrypted at rest, transferred via TLS 1.3+, and never logged in plaintext. JWT auth, RBAC checks, audit logging, and virus scanning are mandatory acceptance criteria for any feature that touches candidate data. Secrets and keys must follow rotation policy.

### IV. Test & Quality Gates
Unit tests cover ≥80% of new backend code, UI flows require Playwright coverage for happy path plus at least one negative scenario, and integration tests exist for cross-layer workflows (e.g., application submission → review → payment). No code merges without automated tests demonstrating the requirement.

### V. Observability-First Operations
Structured logging, metrics, and trace spans must be defined for tenant onboarding, payment flow, seat allocation, and ticket generation. Plans/tasks will call out the signals required (latency, error rate, tenantId tags) so production incidents can be detected and triaged quickly.

## Operational Guardrails

- Technology stack is fixed: Java 21 + Spring Boot 3.4.x backend, PostgreSQL 15+, Next.js 14 frontend, MinIO for storage, Redis for caching. Deviations require governance approval.
- Multi-tenant schema migrations use Flyway with tenant-specific locations; any manual schema work must document rollback.
- Payments integrate only with WeChat Pay and Alipay; all other methods are out of scope for MVP.
- Performance targets from the spec’s Success Criteria are mandatory non-functional requirements and must appear in plans/tests when relevant.

## Workflow Expectations

- Specifications must include user stories, functional/non-functional requirements, success criteria, edge cases, and clarifications before `/speckit.plan`.
- Plans must include a Constitution Check section confirming adherence (tenant isolation, security, testing, observability). Violations require entries in “Complexity Tracking”.
- Tasks must map each deliverable to at least one requirement or success criterion and flag security/observability work explicitly (tag `[SEC]`, `[OBS]` where applicable).
- Code reviews verify: DDD boundaries, RBAC checks, encryption usage, and required tests/logging before approval.

## Governance

This constitution supersedes ad-hoc practices. Amendments require: (1) rationale recorded in PR description, (2) semantic version bump, (3) confirmation that spec/plan/task templates remain aligned. Ratification and amendments occur via repository PR reviewed by technical lead plus product owner. Compliance is reviewed at the end of each major feature cycle; unresolved violations block release. Runtime guidance is recorded in `docs/security-guidelines.md` and `README.md`, which must remain consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2025-01-19 | **Last Amended**: 2025-11-19
