# Quickstart Guide – Multi-Tenant SaaS Exam Registration System

## Prerequisites

- Java 21, Maven 3.9+
- Node.js 18+, pnpm 8 (or npm)
- PostgreSQL 15 with superuser `postgres` / password per `application-dev.yml`
- Redis 7, MinIO (local or Docker), ClamAV daemon
- Alipay & WeChat Pay sandbox credentials (stored in `.env` / Spring config)

## Backend Setup

```powershell
# From repo root
mvn clean install
./scripts/start-backend.ps1 -Profile dev
```

- The script runs Flyway migrations for `public` schema and auto-creates tenant schemas as tenants onboard.
- Environment variables:
  - `DATABASE_URL=jdbc:postgresql://localhost:5432/duanruo-exam-system`
  - `DATABASE_USERNAME=postgres`
  - `DATABASE_PASSWORD=postgres`
  - `JWT_SECRET=<32+ char secret>`
  - `ENCRYPTION_KEY=<32-byte base64>`
  - `MINIO_ENDPOINT=http://localhost:9000`
  - `PAYMENT_WECHAT_APPID`, `PAYMENT_ALIPAY_APPID`, etc.

## Frontend Setup

```powershell
cd web
pnpm install
pnpm dev
```

- Default dev server runs at http://localhost:3000 with proxy pointing to backend `http://localhost:8081/api/v1`.
- Set `.env.local`:
  - `NEXT_PUBLIC_API_URL=http://localhost:8081/api/v1`
  - `NEXT_PUBLIC_TENANT_ID=<tenant_code>`

## Seed & Smoke Test

1. Create a tenant via REST:
   ```powershell
   Invoke-RestMethod -Method POST `
     -Uri http://localhost:8081/api/v1/tenants `
     -Headers @{Authorization="Bearer <super_admin_jwt>"} `
     -Body (@{code="tenant_demo";name="Demo Tenant"} | ConvertTo-Json) `
     -ContentType "application/json"
   ```
   This triggers schema creation plus MinIO namespace initialization.

2. Login as tenant admin, create exam & positions via `/api/v1/tenants/{tenantId}/exams`.

3. Candidate registers through `web` UI, uploads docs (ensure ClamAV is running), submits application.

4. Run auto-review + manual review via reviewer accounts.

5. Trigger payment sandbox script `./scripts/payments/mock-success.ps1` (or manual callback) to move status to `PAID`.

6. Seat allocation:
   ```powershell
   ./scripts/allocate-seats.ps1 -Tenant tenant_demo -ExamId 1 -Strategy position-first
   ```

7. Generate admission tickets automatically or via `./scripts/generate-tickets.ps1`.

8. Import scores:
   ```powershell
   ./scripts/import-scores.ps1 -Tenant tenant_demo -ExamId 1 -Csv ./data/sample-scores.csv
   ```

## Test Commands

- Backend unit/integration: `mvn test`
- Backend quality gates: `mvn checkstyle:check spotbugs:check pmd:check`
- Frontend lint/typecheck: `cd web && pnpm lint && pnpm type-check`
- Playwright E2E: `cd web && pnpm test:e2e`
- BDD flows: `cd web && pnpm test:bdd`

## Verification Checklist

- [ ] Tenant onboarding creates schema + storage namespace in < 10 s.
- [ ] Candidate submission → auto-review response < 2 s.
- [ ] Manual review queue locking releases after 30 min heartbeat timeout.
- [ ] Payment callbacks idempotent; duplicate callback ignored (log event).
- [ ] Seat allocation completes for 50k sample dataset in < 5 min.
- [ ] Ticket PDF includes QR code + tenant branding.
- [ ] Score import validates 0–100 range and rejects malformed rows with report.

