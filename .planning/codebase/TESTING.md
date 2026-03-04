# Testing Patterns

**Analysis Date:** 2026-03-04

## Test Framework

**Backend:**
- Runner: Jest 30.0.0 (configured in `server/package.json`)
- Config location: `server/package.json` (inline jest config)
- Transform: ts-jest 29.2.5 (TypeScript → JavaScript)
- Test environment: Node.js

**Frontend (E2E):**
- Runner: Playwright (@playwright/test)
- Config: `web/playwright.config.ts`
- Browsers: Chromium, Firefox, WebKit (configurable)
- Test directory: `web/tests/` (configurable)

**Frontend (BDD):**
- Framework: Cucumber.js
- Config: `web/cucumber.js` (standard) and `web/cucumber-layered.js` (layered testing)
- Step definitions: `web/tests/bdd/step-definitions/**/*.ts`
- Support: `web/tests/bdd/support/**/*.ts`
- Feature files: `web/tests/bdd/features/**/*.feature`

**Assertion Library:**
- Backend: Jest built-in `expect()`
- Frontend E2E: Playwright assertions (`expect()` imported from `@playwright/test`)
- Frontend BDD: Chai assertions (`import { expect } from 'chai'`)

## Run Commands

**Backend (Server):**
```bash
npm run test              # Run all unit tests
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
npm run test:debug       # Debug mode with inspector
npm run test:e2e         # E2E tests (requires jest-e2e.json config)
```

**Frontend E2E (Playwright):**
```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # UI mode (interactive)
npm run test:e2e:headed  # Run headed (visible browser)
npm run test:e2e:debug   # Debug mode
npm run test:e2e:report  # View HTML report
```

**Frontend BDD (Cucumber):**
```bash
npm run test:bdd         # Run all BDD scenarios
npm run test:bdd:smoke   # @smoke tagged scenarios
npm run test:bdd:p0      # @p0 tagged (critical)
npm run test:bdd:p1      # @p1 tagged (high priority)
npm run test:bdd:ready   # All except @wip
npm run test:bdd:wip     # Work-in-progress scenarios
npm run test:bdd:layer-N # Layer-specific tests (0-7)
npm run test:bdd:critical # @critical tagged
npm run test:bdd:security # @security tagged
npm run test:bdd:report  # View HTML report
```

## Test File Organization

**Backend Location:**
- Co-located with source: `{module}/` contains both `.ts` and `.spec.ts`
- Example: `server/src/exam/exam.service.ts` + `server/src/exam/exam.service.spec.ts`

**Naming Pattern:**
- `{entity}.spec.ts` (unit tests for services, controllers, guards)
- Example: `exam.service.spec.ts`, `jwt.strategy.spec.ts`, `tenant.middleware.spec.ts`

**Frontend E2E Location:**
- Playwright: `web/tests/e2e/ui-bdd/*.spec.ts` (UI-based E2E tests using Playwright)
- Directory structure organized by role/feature

**Frontend BDD Location:**
- Features: `web/tests/bdd/features/*.feature` (Gherkin scenarios)
- Step definitions: `web/tests/bdd/step-definitions/{entity}.steps.ts`
- Support/fixtures: `web/tests/bdd/support/world.ts` (shared context)

## Test Structure

**Backend Unit Test Pattern:**

```typescript
import { ExamService } from './exam.service';

describe('ExamService', () => {
  let service: ExamService;

  beforeEach(() => {
    service = new ExamService({} as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

**Backend Integration Test Pattern (with Module):**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    userTenantRole: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

**Frontend BDD Pattern:**

```typescript
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import axios from 'axios';

const API_BASE = process.env.API_BASE || 'http://localhost:8081/api/v1';

let currentUser: { token?: string; roles?: string[] } = {};
let lastResponse: any = {};

Given('数据库中有超级管理员账号 {string}', async function (credentials: string) {
  const [username, password] = credentials.split('/');
  const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
  currentUser.token = response.data.data.token;
  currentUser.roles = response.data.data.user.roles;
});

When('输入用户名 {string} 和密码 {string}', async function (username: string, password: string) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
    lastResponse = response.data;
    currentUser.token = response.data.data?.token;
  } catch (error: any) {
    lastResponse = error.response?.data || { success: false, message: error.message };
  }
});

Then('登录成功', function () {
  expect(lastResponse.success).to.be.true;
  expect(currentUser.token).to.be.a('string');
});
```

## Mocking

**Framework:** Jest (backend), Sinon/Manual mocks (frontend)

**Backend Mock Pattern:**

```typescript
const mockExamService = {
  findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockPrismaService = {
  client: {
    exam: { findUnique: jest.fn().mockResolvedValue({ id: 'e1', title: 'Test Exam' }) },
  },
};

beforeEach(() => {
  controller = new ExamController(
    mockExamService as unknown as ExamService,
    mockPrismaService as unknown as PrismaService,
  );
});
```

**Frontend BDD Mock Pattern (in `world.ts`):**

```typescript
private handleMockResponse(path: string, method: string, body?: any) {
  if (path.includes('/auth/login')) {
    return { success: true, data: { token: 'mock-token', user: { id: 'u1', username: 'admin' } } };
  }
  if (path.includes('/tenants')) {
    return { success: true, data: [{ id: 'demo', name: 'Demo Tenant', status: 'ACTIVE' }] };
  }
  if (path.includes('/exams')) {
    return { success: true, data: { items: [{ id: 'e1', title: 'Demo Exam' }], total: 1 } };
  }
  const mockData = { success: true, data: { id: 'mock-id-' + Math.random().toString(36).substr(2, 9) } };
  this.lastResponse = mockData;
  return mockData;
}
```

**What to Mock:**
- Database layer (Prisma client)
- External services (JwtService, EmailService)
- File operations (MinIO client)
- API calls in frontend tests

**What NOT to Mock:**
- Service business logic (test the actual service)
- Decorators (@Injectable, @Controller)
- HTTP exception classes (use real instances)
- Data mappers/transformers

## Fixtures and Factories

**Test Data:**

Location: `server/src/test/fixtures/index.ts`

Pattern:
```typescript
// Manual fixture creation or factory functions
export const createMockExam = (overrides?: Partial<Exam>): Exam => ({
  id: 'e1',
  code: 'TEST',
  title: 'Test Exam',
  status: 'PUBLISHED',
  ...overrides,
});
```

**Frontend BDD Fixtures:**
- Stored in CustomWorld class in `web/tests/bdd/support/world.ts`
- Mock responses generated on-the-fly in `handleMockResponse()`
- API responses follow contract: `{ success: true, data: T | T[] }`

## Coverage

**Backend:**
- Tool: Jest built-in coverage reporter
- Config: Coverage directory is `server/coverage/`
- Collect from: All `.ts` and `.js` files in `src/` directory
- View: Open `coverage/index.html` after `npm run test:cov`
- No minimum enforced; current state unknown

**Frontend:**
- Playwright: HTML report at `playwright-report/` after test run
- Cucumber: JSON/XML/HTML reports at `test-results/bdd/`
- Coverage: Not explicitly tracked for BDD tests

## Test Types

**Backend Unit Tests:**
- Scope: Individual services, controllers, guards
- Approach: Mock dependencies, test pure logic
- Example: `exam.service.spec.ts` tests `findById()`, `create()`, `update()`
- State: Many tests are skeleton-only ("should be defined")

**Backend Integration Tests:**
- Framework: NestJS Test module with real dependency injection
- Approach: Use `Test.createTestingModule()` to compose modules
- Mocking: Still mock database, but test real module integration
- Example: `auth.service.spec.ts` composes AuthService with JwtService

**Frontend E2E Tests (Playwright):**
- Scope: Full user workflows (login → action → verify)
- Approach: Browser automation, real UI, mock backend optional
- Config: `web/playwright.config.ts` defines browsers, timeouts, artifacts
- Artifacts: Screenshots/video on failure, HTML report
- Example: Located in `web/tests/e2e/ui-bdd/` (role-based scenarios)

**Frontend BDD Tests (Cucumber):**
- Scope: Behavior-driven scenarios in Gherkin language
- Approach: Given-When-Then structure, step definitions in TypeScript
- Features: 10 feature files (auth, candidate, admin, reviewer, tickets, seating, etc.)
- Layering: 8 layers (0-7) allow progressive complexity
- Tagging: `@smoke`, `@p0`, `@p1`, `@critical`, `@security`, `@wip` for organization
- Example: `01-auth.feature` tests login flows; `06-recruitment-full-lifecycle.feature` tests end-to-end workflow

**Backend E2E Tests:**
- Framework: Jest with separate config `test/jest-e2e.json` (location/structure unclear)
- Approach: Not extensively used; most coverage via unit + integration tests

## Common Patterns

**Async Testing (Backend):**

```typescript
// Service methods are async, mocks should return Promises
const mockPrisma = {
  user: {
    findUnique: jest.fn().mockResolvedValue({ id: 'u1', username: 'admin' }),
  },
};

// In test
await service.findById('u1');
expect(mockPrisma.user.findUnique).toHaveBeenCalled();
```

**Async Testing (Frontend BDD):**

```typescript
When('输入用户名 {string}', async function (username: string) {
  // Step functions are async
  await someAsyncOperation();
});

// Cucumber automatically awaits step functions
```

**Error Testing (Backend):**

```typescript
it('should throw NotFoundException', () => {
  jest.spyOn(mockPrisma.exam, 'findUnique').mockResolvedValue(null);

  expect(async () => {
    await service.findById('invalid-id');
  }).rejects.toThrow(NotFoundException);
});
```

**Error Testing (Frontend BDD):**

```typescript
When('輸入無效密碼', async function (password: string) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { username: 'user', password });
    this.lastResponse = response.data;
  } catch (error: any) {
    this.lastError = error;
    this.lastResponse = error.response?.data || { success: false };
  }
});

Then('登錄失敗', function () {
  expect(this.lastResponse.success).to.be.false;
});
```

## Configuration Files

**Backend Jest Config:**
- Location: Embedded in `server/package.json` (lines 84-100)
- Key settings:
  - Root dir: `src`
  - Pattern: `*.spec.ts`
  - Transform: ts-jest
  - Coverage dir: `../coverage`
  - Environment: node

**Frontend Playwright Config:**
- Location: `web/playwright.config.ts`
- Key settings:
  - Test dir: `./tests`
  - Fully parallel: true
  - Retries: 2 on CI, 0 locally
  - Browsers: Chromium, Firefox, WebKit (+ mobile variants)
  - Screenshots/video: on failure only
  - Action timeout: 10s
  - Navigation timeout: 30s
  - Trace: on-first-retry

**Frontend Cucumber Config:**
- Location: `web/cucumber.js` (standard) and `web/cucumber-layered.js` (layered)
- Key settings:
  - Step definitions: `tests/bdd/step-definitions/**/*.ts`
  - Format: HTML, JSON, JUnit reports to `test-results/bdd/`
  - Parallel: 1 (sequential)
  - Timeout: 60s per step (increased from 30s)
  - Requires: tsx/cjs for TypeScript support

---

*Testing analysis: 2026-03-04*
