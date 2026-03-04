# Technology Stack

**Analysis Date:** 2026-03-04

## Languages

**Primary:**
- TypeScript 5.7-5.8 - Used for all backend and frontend code
- JavaScript - Configuration files and utilities

**Secondary:**
- SQL (PostgreSQL dialects) - Database queries via Prisma

## Runtime

**Environment:**
- Node.js v22.17.1 (current development version, no `.nvmrc` pinning)
- NPM v10.9.2

**Package Manager:**
- NPM (workspace: two independent npm projects)
- Lockfile: `package-lock.json` (present in both `server/` and `web/`)

## Frameworks

**Backend:**
- NestJS 11.0.1 - HTTP API framework (`server/src/main.ts`)
- NestJS modules: Common, Config, JWT, Passport, Platform Express, Cache Manager, Schedule, Swagger

**Frontend:**
- Next.js 14.2.5 - React framework with App Router (`web/src/app/`)
- React 18.3.1 - UI library
- React DOM 18.3.1

**Testing:**
- Jest 30.0.0 - Backend unit tests (config: `server/jest.config.json` via `package.json`)
- ts-jest 29.2.5 - TypeScript support for Jest
- Playwright 1.56.0 - Frontend E2E tests (`web/tests/e2e/`, config: `web/playwright.config.ts`)
- Cucumber 11.1.0 - BDD tests (`web/tests/bdd/features/`)
- @testing-library/react 16.3.1 - React component testing
- Vitest 4.0.16 - Lightweight test runner (dev dependency)
- Supertest 7.0.0 - HTTP assertion library for backend

**Build/Dev:**
- Prisma 6.2.1 - ORM with schema migration (`server/prisma/schema.prisma`)
- @nestjs/cli 11.0.0 - NestJS development CLI
- @nestjs/schematics 11.0.0 - Nest project generator
- ts-loader 9.5.2 - TypeScript loader for webpack
- ts-node 10.9.2 - TypeScript execution for Node
- Tailwind CSS 3.4.0 - Utility-first CSS framework (`web/tailwind.config.js`)
- PostCSS 8.4.32 - CSS transformation
- Autoprefixer 10.4.16 - Vendor prefix generation
- Prettier 3.4.2 - Code formatter
- ESLint 9.18.0 (backend), 8.56.0 (frontend) - Linter with TypeScript support
- TypeScript ESLint 8.20.0 - TypeScript linting rules

## Key Dependencies

**Critical - Backend:**
- `@prisma/client` 6.2.1 - Database ORM client
- `@prisma/adapter-pg` 6.2.1 - PostgreSQL adapter for Prisma (uses raw `pg.Pool`)
- `pg` 8.16.3 - Native PostgreSQL client driver
- `@nestjs/jwt` 11.0.2 - JWT token handling
- `passport` 0.7.0, `passport-jwt` 4.0.1 - Authentication strategy
- `bcrypt` 6.0.0 - Password hashing
- `minio` 8.0.6 - S3-compatible object storage client
- `ioredis` 5.9.3 - Redis client for caching
- `cache-manager` 7.2.8, `cache-manager-redis-yet` 5.1.5 - Cache abstraction with Redis backend

**Critical - Frontend:**
- `next` 14.2.5 - React framework with server-side rendering
- `axios` 1.12.2 - HTTP client (wraps Fetch API in `web/src/lib/api.ts`)
- `react-query` (TanStack) 5.87.4 - Server state management
- `react-hook-form` 7.48.2 - Form state management
- `zod` 3.22.4 - Schema validation library

**UI Components - Frontend:**
- Radix UI (20+ component libraries) - Headless component primitives
- `shadcn/ui` - Built on Radix UI (located in `web/src/components/ui/`)
- `lucide-react` 0.525.0 - Icon library
- `recharts` 2.15.4 - Charting library

**Utilities - Backend:**
- `uuid` 10.0.0 - UUID generation
- `decimal.js` 10.6.0 - Arbitrary-precision decimal arithmetic (exam scores)
- `crypto-js` 4.2.0 - Cryptography utilities
- `class-transformer` 0.5.1 - Object transformation (DTO serialization)
- `class-validator` 0.14.3 - Data validation via decorators
- `reflect-metadata` 0.2.2 - Reflection for decorators

**Utilities - Frontend:**
- `date-fns` 2.30.0 - Date manipulation
- `react-day-picker` 8.10.0 - Calendar component
- `react-pdf` 10.2.0 - PDF viewer
- `react-quill` 2.0.0 - Rich text editor
- `papaparse` 5.5.3 - CSV parser
- `clsx` 2.1.1 - Conditional className utility
- `class-variance-authority` 0.7.1 - Type-safe CSS variants
- `tailwind-merge` 3.3.1 - Tailwind class merging
- `sonner` 1.3.1 - Toast notification library
- `vaul` 0.7.9 - Drawer component

**API Contract:**
- `openapi-typescript` 7.10.1 - Generate TypeScript types from OpenAPI spec
- `openapi-fetch` 0.13.8 - Type-safe fetch wrapper for OpenAPI
- `dredd` 14.1.0 - Contract testing against OpenAPI spec

**Observability:**
- `source-map-support` 0.5.21 - Source map resolution in stack traces

## Configuration

**Environment - Backend:**
- `.env` file required with:
  - `DATABASE_URL` - PostgreSQL connection string (schema=public)
  - `PORT` - API port (default 8081)
  - `NODE_ENV` - environment (development/production)
  - `JWT_SECRET` - JWT signing key (required in production)
  - `JWT_EXPIRES_IN` - Token expiry (default 86400s)
  - `REDIS_URL` - Redis connection (default redis://localhost:6379)
  - `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL` - MinIO configuration
  - `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` - MinIO credentials
  - `MINIO_BUCKET` - Default bucket name (example: exam-system)
  - `MINIO_PUBLIC_ENDPOINT` - Public URL for presigned URLs
  - `MINIO_CORS_ORIGINS` - CORS origins for MinIO
  - File: `server/.env`

**Environment - Frontend:**
- `BACKEND_ORIGIN` - Backend API origin (proxied via Next.js rewrites)
- `BACKEND_PORT` - Backend port for rewrite routing
- `NEXT_PUBLIC_API_URL` - API base URL (default /api/v1)

**Build Configuration - Backend:**
- `server/tsconfig.json` - TypeScript config (CommonJS, ES2021 target)
- `server/eslint.config.mjs` - ESLint rules
- `server/.env` - Development environment variables
- `server/prisma/schema.prisma` - Prisma schema with PostgreSQL dialect

**Build Configuration - Frontend:**
- `web/tsconfig.json` - TypeScript config (ES5 target, path alias @/*)
- `web/next.config.js` - Next.js config with API rewrites
- `web/tailwind.config.js` - Tailwind CSS configuration
- `web/postcss.config.js` - PostCSS plugins
- `web/playwright.config.ts` - E2E test configuration

## Platform Requirements

**Development:**
- Node.js v18+ (tested with v22.17.1)
- PostgreSQL 12+ database
- Redis server (for caching, default localhost:6379)
- MinIO server (for object storage, default localhost:9000)
- Modern browser with ES6 support

**Production:**
- Node.js v18+ runtime
- PostgreSQL database (production-ready instance)
- Redis (optional but recommended for caching)
- MinIO or S3-compatible object storage
- Reverse proxy (nginx/Caddy) for HTTPS and static asset serving
- Docker / container orchestration recommended

---

*Stack analysis: 2026-03-04*
