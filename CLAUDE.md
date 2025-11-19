# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Exam Registration System (考试报名系统)** - A multi-tenant SaaS platform for recruitment exam registration, built with DDD architecture. Supports multiple exams, positions, subjects, three-tier review workflow, payment processing, admission ticket generation, and venue/seat allocation.

### Technology Stack

**Backend:**
- Java 21 + Spring Boot 3.4.1
- PostgreSQL 15+ with Hibernate Schema-based multi-tenancy
- MinIO for file storage
- Maven multi-module project
- DDD + Hexagonal Architecture

**Frontend:**
- Next.js 14 (App Router) + React 18
- TypeScript 5.x
- Shadcn/ui + Tailwind CSS 3.x
- TanStack Query + React Hook Form + Zod
- Playwright for E2E testing

## Development Commands

### Backend

**Start backend (recommended):**
```powershell
# PowerShell
./scripts/start-backend.ps1              # Default dev profile
./scripts/start-backend.ps1 -Profile dev # Specify profile
```

```bat
# Windows batch
scripts\start-backend.bat        # Default dev
scripts\start-backend.bat prod   # Specify profile
```

**Build and run manually:**
```bash
# From repository root
mvn clean compile
cd exam-bootstrap
mvn spring-boot:run

# Or from root with specific options
mvn -f exam-bootstrap/pom.xml -DskipTests spring-boot:run \
  -Dspring-boot.run.profiles=dev \
  -Dspring-boot.run.jvmArguments="-Dserver.port=8081"
```

**Run tests:**
```bash
mvn test                    # Run all unit tests
mvn verify                  # Run integration tests
mvn clean install           # Build and install all modules
```

**Code quality checks:**
```bash
mvn checkstyle:check       # Code style validation
mvn spotbugs:check         # Static analysis
mvn pmd:check              # PMD analysis
mvn jacoco:report          # Code coverage report
```

### Frontend

**Development:**
```bash
cd web
npm install                # Install dependencies
npm run dev                # Start dev server (http://localhost:3000)
npm run build              # Production build
npm run start              # Start production server
npm run lint               # ESLint check
npm run type-check         # TypeScript compilation check
```

**Testing:**
```bash
# E2E tests with Playwright
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run with UI mode
npm run test:e2e:headed    # Run in headed mode
npm run test:e2e:debug     # Debug mode

# BDD tests with Cucumber
npm run test:bdd           # Run all BDD tests
npm run test:bdd:smoke     # Smoke tests
npm run test:bdd:p0        # P0 priority tests
npm run test:bdd:p1        # P1 priority tests
```

## Architecture Overview

### DDD Layered Architecture

The backend follows strict DDD layering with module separation:

```
exam-registration/
├── exam-shared/              # Shared library: common value objects, exceptions, utilities
├── exam-domain/              # Domain layer: entities, value objects, aggregates, domain services, events
├── exam-application/         # Application layer: use cases, application services, DTOs
├── exam-infrastructure/      # Infrastructure: JPA repositories, MinIO client, external service clients
├── exam-adapter-rest/        # REST adapter: controllers, DTOs, mappers
├── exam-adapter-scheduler/   # Scheduler adapter: outbox publisher, scheduled tasks
└── exam-bootstrap/           # Bootstrap: Spring Boot main class, configuration assembly
```

**Key architectural principles:**
1. **Domain layer**: Pure POJOs, no framework dependencies
2. **Application layer**: Orchestrates transactions, calls domain objects
3. **Infrastructure layer**: Implements repository interfaces, handles external dependencies
4. **Adapter layer**: Protocol adaptation, request/response transformation

### Multi-Tenant Architecture

**Strategy**: PostgreSQL Schema-based physical isolation using Hibernate SCHEMA multitenancy

**Implementation:**
- Each tenant has its own schema (e.g., `tenant_company_a`, `tenant_company_b`)
- `public` schema stores global data: `tenants`, `users`, `user_tenant_roles`
- Tenant-specific schemas contain: `exams`, `positions`, `applications`, `tickets`, etc.
- Runtime routing via `search_path` set by `TenantSchemaConnectionProvider`
- Tenant extraction: `X-Tenant-ID` header → URL path `/tenants/{tenantId}/...` → default

**Configuration files:**
- `exam-bootstrap/src/main/java/com/duanruo/exam/config/HibernateMultiTenancyConfig.java`
- `exam-infrastructure/.../multitenancy/TenantInterceptor.java`
- `exam-infrastructure/.../multitenancy/SchemaManagementService.java`

**Note**: ShardingSphere dependencies are present but NOT currently active. The system uses Hibernate's native multi-tenancy instead.

### Application State Machine

Registration application status flow:
```
Draft → Submitted → AutoRejected/AutoPassed/PendingPrimaryReview
     → PrimaryRejected/PrimaryPassed → PendingSecondaryReview
     → SecondaryRejected/Approved → Paid → TicketIssued
```

## API Structure

**Base URL**: `http://localhost:8081/api/v1`

**Authentication**: JWT Bearer token in `Authorization` header

**Tenant Routing**: Include `X-Tenant-ID` header or use path parameter `/tenants/{tenantId}/...`

**Key endpoint patterns:**
```
GET    /api/v1/tenants/{tenantId}/exams                     # List exams
POST   /api/v1/tenants/{tenantId}/exams                     # Create exam (ADMIN)
GET    /api/v1/tenants/{tenantId}/exams/{id}                # Get exam details
POST   /api/v1/tenants/{tenantId}/exams/{examId}/positions  # Create position

POST   /api/v1/applications                                 # Submit application (CANDIDATE)
GET    /api/v1/applications/my                              # My applications (CANDIDATE)

GET    /api/v1/reviews/pending                              # Pending reviews (REVIEWER)
POST   /api/v1/reviews/{id}/approve                         # Approve review (REVIEWER)
```

**Swagger UI**: http://localhost:8081/api/swagger-ui.html (when running)

### Date/Time Format Convention

- **String format**: `yyyy-MM-dd HH:mm:ss`
- **Timezone**: `Asia/Shanghai`
- Controllers use relative paths (no `/api` or `/v1` in `@RequestMapping`)
- Application context-path is `/api/v1` (configured in `application.yml`)

## Critical Development Guidelines

### Security Guidelines (MANDATORY)

**READ FIRST**: `docs/security-guidelines.md` - Backend authentication and authorization unified development standards

Key security requirements:
- JWT-based authentication
- Role-based access control (RBAC): `SUPER_ADMIN`, `TENANT_ADMIN`, `PRIMARY_REVIEWER`, `SECONDARY_REVIEWER`, `CANDIDATE`
- Tenant isolation enforcement at interceptor level
- PII data encryption using AES
- Input validation using Jakarta Validation + custom validators

### Backend Development

**Controller pattern:**
```java
@RestController
@RequestMapping("/tenants/{tenantId}/exams")
@Tag(name = "Exam Management")
@Validated
public class ExamController {

    @GetMapping("/{examId}")
    @Operation(summary = "Get exam details")
    public Result<ExamDTO> getExam(
        @PathVariable Long tenantId,
        @PathVariable Long examId
    ) {
        // Implementation
    }
}
```

**Service pattern:**
```java
@Service
@Transactional(rollbackFor = Exception.class)
public class ExamServiceImpl implements ExamService {

    @Override
    public ExamDTO createExam(CreateExamRequest request) {
        // 1. Parameter validation
        // 2. Business logic
        // 3. Data persistence
        // 4. Return result
    }
}
```

**Repository pattern:**
- Domain layer defines repository interfaces (ports)
- Infrastructure layer provides JPA implementations (adapters)
- Use mappers to convert between JPA entities and domain aggregates

### Frontend Development

**Project structure:**
```
web/src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages
│   ├── (candidate)/         # Candidate portal
│   ├── (admin)/             # Admin portal
│   └── api/                 # API routes
├── components/               # Components
│   ├── ui/                  # Shadcn UI components
│   ├── forms/               # Form components
│   └── features/            # Business components
├── lib/                     # Libraries
│   ├── api/                 # API client
│   └── utils/               # Utilities
├── hooks/                   # Custom hooks
└── types/                   # TypeScript types
```

**API client pattern:**
```typescript
// Automatically adds JWT token and X-Tenant-ID header
import { apiClient } from '@/lib/api/client';

const response = await apiClient.get('/exams');
```

## Database Management

### Flyway Migrations

**Two-tier migration structure:**

1. **Public schema migrations** (`exam-infrastructure/src/main/resources/db/migration/`):
   - `V001__create_tenants_table.sql`
   - `V002__create_users_table.sql`
   - `V003__create_user_tenant_roles_table.sql`

2. **Tenant schema migrations** (`exam-infrastructure/src/main/resources/db/tenant-migration/`):
   - `V001__create_business_tables.sql`
   - `V002__*.sql` (subsequent migrations)

**Tenant schema creation:**
- When a new tenant is created, `SchemaManagementService` automatically:
  1. Creates the schema: `CREATE SCHEMA tenant_{code}`
  2. Runs Flyway migrations in the new schema
  3. Sets up initial data if needed

**Verification scripts:**
```powershell
./scripts/verify-tenant-schema-structure.ps1
./scripts/check-flyway-history.ps1
```

### Database Connection

**Development configuration** (`application-dev.yml`):
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/duanruo-exam-system
    username: postgres
    password: postgres
```

**Production**: Use environment variables:
- `DATABASE_URL`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `JWT_SECRET`
- `ENCRYPTION_KEY`

## Testing Strategy

### Unit Tests
- Domain layer: Test business logic without framework dependencies
- Target coverage: ≥ 80%
- Run: `mvn test`

### Integration Tests
- Application + infrastructure layers
- Uses Testcontainers for PostgreSQL/MinIO
- Run: `mvn verify`

### E2E Tests (Playwright)
- UI-based workflow testing
- Scenarios: Super Admin, Tenant Admin, Candidate, Reviewer
- Run: `npm run test:e2e` (from `web/` directory)

### BDD Tests (Cucumber)
- Behavior-driven scenarios in Gherkin
- Priority levels: Smoke, P0, P1
- Run: `npm run test:bdd` (from `web/` directory)

## Key Business Workflows

### Three-Tier Review Engine

1. **Auto Review**: Rule-based validation (age, gender, education, ID format)
2. **Primary Review**: Manual verification by PRIMARY_REVIEWER
3. **Secondary Review**: Final approval by SECONDARY_REVIEWER

**Auto-review rules** are configurable per exam (JSON-based rule engine)

### Admission Ticket Generation

- Triggered after payment confirmation
- Components: ticket number, QR code, PDF generation
- Ticket number strategy: configurable template per exam
- PDF generation using iText7
- Storage: MinIO

### Seat Allocation

- Triggered by admin after registration closes
- Strategy: configurable (random, by registration time, by priority)
- Venue/room capacity management
- Conflict detection for multi-subject exams

## Important Notes

### Module Dependencies

When modifying domain models:
1. Update domain layer first (`exam-domain`)
2. Update JPA entities in infrastructure (`exam-infrastructure`)
3. Update DTOs in adapter layer (`exam-adapter-rest`)
4. Update mappers (MapStruct)
5. Run: `mvn clean install` from root

### Startup Order for Full System

```powershell
# Recommended: Use the all-in-one script
./scripts/start-all.ps1

# Manual steps:
# 1. Ensure PostgreSQL is running
# 2. Ensure MinIO is running (optional for basic testing)
# 3. Start backend: ./scripts/start-backend.ps1
# 4. Start frontend: cd web && npm run dev
```

### Common Issues

**Issue**: "Tenant schema not found"
- **Fix**: Ensure tenant is created via API or run: `./scripts/create-new-tenant-via-api.ps1`

**Issue**: "Flyway migration conflicts"
- **Fix**: Check: `./scripts/check-flyway-history.ps1`
- Repair: `./scripts/repair-flyway-history.ps1`

**Issue**: "JWT token expired"
- **Fix**: Re-login through `/api/v1/auth/login` endpoint

## File Locations Reference

- **Security guidelines**: `docs/security-guidelines.md`
- **Multi-tenancy architecture**: `docs/architecture/saas-multitenancy-and-subjects.md`
- **PRD**: `prd.md` (EARS-based requirements)
- **Design document**: `design.md` (DDD implementation guide)
- **Backend startup scripts**: `scripts/start-backend.ps1` or `scripts/start-backend.bat`
- **Public schema migrations**: `exam-infrastructure/src/main/resources/db/migration/`
- **Tenant schema migrations**: `exam-infrastructure/src/main/resources/db/tenant-migration/`
- **Application config**: `exam-bootstrap/src/main/resources/application*.yml`

## Code Quality Requirements

- Unit test coverage ≥ 80%
- Pass Checkstyle, SpotBugs, PMD checks
- Pass security scanning (OWASP Dependency Check)
- Follow DDD layering principles (no framework dependencies in domain layer)
- Use MapStruct for DTO/entity mapping
- Implement audit logging for all state changes
