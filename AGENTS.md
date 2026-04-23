# Repository Guidelines

## Project Structure & Module Organization
This repository is split into two deployable apps: `server` (NestJS 11 API) and `web` (Next.js 14 App Router). Backend business modules live in `server/src` and are wired through `server/src/app.module.ts`; key domains include `auth`, `tenant`, `exam`, `application`, `review`, `payment`, `ticket`, `seating`, and `statistics`. Data access is centralized in Prisma (`server/prisma/schema.prisma`) with tenant-aware execution in `server/src/prisma/prisma.service.ts`.

Frontend routes are in `web/src/app`, shared UI in `web/src/components`, and API access in `web/src/lib/api.ts` plus generated OpenAPI types under `web/src/lib/api`. Supporting artifacts live in `docs` (architecture/test reports) and `scripts` (DB migration and verification helpers). Treat `.agents/skills/gstack` as third-party/tooling code unless a task explicitly targets it.

## Build, Test, and Development Commands
- Root quality scan: `npm run sonar`
- Backend: `cd server && npm run dev`, `npm run build`, `npm run start:prod`, `npm run lint`, `npm run test`, `npm run test:cov`, `npm run test:e2e`
- Frontend: `cd web && npm run dev`, `npm run build`, `npm run lint`, `npm run type-check`, `npm run test`, `npm run test:coverage`, `npm run test:e2e`, `npm run test:bdd`, `npm run openapi:refresh`
- Single-test examples:
  - Backend: `cd server && npm test -- auth/auth.service.spec.ts`
  - Frontend: `cd web && npx vitest run src/hooks/__tests__/usePermissions.test.ts`

## Coding Style & Naming Conventions
TypeScript strict mode is enabled in both apps (`server/tsconfig.json`, `web/tsconfig.json`). Backend ESLint (`server/eslint.config.mjs`) enforces `@typescript-eslint/no-explicit-any`, `no-floating-promises`, and the `no-unsafe-*` suite; unused variables must be `_`-prefixed. Backend Prettier (`server/.prettierrc`) enforces single quotes and trailing commas. Frontend linting extends `next/core-web-vitals` (`web/.eslintrc.json`).

Follow existing naming patterns: backend service/controller/dto filenames in kebab-case, React components in PascalCase, hooks prefixed with `use`, and keep path-alias imports via `@/*` on the frontend.

## Testing Guidelines
Backend tests use Jest and Supertest; specs are colocated as `*.spec.ts`. Frontend uses Vitest + Testing Library for unit/component tests, Playwright for E2E, Cucumber for BDD flows, and Dredd for contract checks. CI (`.github/workflows/ci.yml`) runs backend `lint + test` and frontend `lint + type-check + test`; run the same set locally before opening a PR.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit style: `feat(server): ...`, `feat(web): ...`, `fix(server): ...`, `test(web): ...`, `docs: ...`, `chore: ...`, `ci: ...`. Keep using `type(scope): short subject` with scopes such as `server`, `web`, or `repo`. No PR template or Husky/pre-commit hooks were found, so include manual PR notes for scope, verification commands, and risk/rollback considerations.

## Agent Instructions
Per `.cursor/rules/claude.md`, do not bypass typing via `any`/`@ts-ignore`; fix root causes instead of introducing temporary workarounds. For lint/type/test failures, prioritize reproducible diagnostics and verified fixes.
