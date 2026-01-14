# Research Notes – Multi-Tenant SaaS Exam Registration System

All previously open questions in the technical context have been resolved. Key decisions are documented below following the Decision / Rationale / Alternatives structure.

## Decision: Observability Stack (Logs, Metrics, Traces)
- **Decision**: Instrument backend services with OpenTelemetry (OTLP exporter) writing to Prometheus (metrics), Loki (logs via structured JSON), and Tempo/Jaeger (traces), surfaced through Grafana dashboards. Frontend uses Next.js middleware to emit structured logs to the same pipeline.
- **Rationale**: Constitution mandates observability for tenant onboarding, payments, seat allocation, ticketing. OpenTelemetry is vendor-neutral, integrates cleanly with Spring Boot + Next.js, and supports traceparent propagation through HTTP, making it straightforward to correlate multi-step workflows.
- **Alternatives Considered**:
  1. **AWS X-Ray / CloudWatch** – tightly coupled to AWS; rejected to keep deployment agnostic.
  2. **New Relic / Datadog SaaS** – simplified setup but introduces licensing constraints and less control over tenant data locality.

## Decision: Payment Sandbox & Idempotency Strategy
- **Decision**: Use official WeChat Pay/Alipay sandbox credentials with dedicated callback endpoints per environment. Persist payment orders in `payment_records`, enforce uniqueness on transaction_id, and process callbacks inside a single Spring transaction guarded by `SELECT ... FOR UPDATE` to guarantee idempotency.
- **Rationale**: Specification requires idempotent payment handling and signature verification. Sandbox parity enables automated integration tests. Database-level locking keeps implementation simple and auditable.
- **Alternatives Considered**:
  1. **In-memory dedup cache (Redis SETNX)** – faster but loses history and complicates recovery after restarts.
  2. **Message queue outbox** – powerful for scale, but adds infrastructure overhead for MVP.

## Decision: Seat Allocation Algorithm
- **Decision**: Implement a hybrid approach: pre-sort paid candidates by position (primary key) then by submission timestamp. Use chunked allocation per venue/room to meet the 50k-in-5-min goal. Persist intermediate allocation batches to allow resumable runs. Manual swaps go through the same service with optimistic locking.
- **Rationale**: Meets success metric, honors “position-first” strategy, and avoids full in-memory shuffles. Chunking plus streaming writes prevents memory spikes.
- **Alternatives Considered**:
  1. **Pure random allocation** – simpler but violates “group by position” acceptance criterion.
  2. **Graph/network-flow solver** – flexible but overkill, slower to implement.

## Decision: Document Security & Virus Scanning
- **Decision**: All uploads hit a temporary MinIO bucket via presigned URL, then a background worker (Spring @Async + Redis queue) runs ClamAV scanning before moving files to tenant bucket. Metadata stores AES-encrypted identifiers (KMS-managed key). Expired or rejected documents are flagged for a 90-day cleanup job.
- **Rationale**: Aligns with security assumptions and constitution (PII encryption, virus scanning, retention). Async scanning keeps submission latency low while ensuring only clean files are available to reviewers.
- **Alternatives Considered**:
  1. **Inline scanning during upload** – secure but adds >10 s latency; hurts UX.
  2. **Third-party scanning API** – reduces maintenance but introduces external dependency and PII exposure risk.

## Decision: Auto-Review Rule Engine Implementation
- **Decision**: Implement rule definitions as JSON stored per exam, parsed into a lightweight rule DSL executed within `exam-domain`. Use strategy pattern for age/gender/education/document checks, and allow future rules by registering new beans. Persist results as structured JSON for auditing.
- **Rationale**: Keeps domain layer framework-free, enables tenant-level configurability, and satisfies requirement to store pass/fail details.
- **Alternatives Considered**:
  1. **Drools or full rule engine** – powerful but heavyweight for current rule set.
  2. **Hard-coded checks per position** – fast but inflexible for future rules.

