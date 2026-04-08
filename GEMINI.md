# Project Overview: duanruo-exam-system2

A comprehensive multi-tenant recruitment examination system built with modern web technologies.

## Architecture
- **Multi-tenancy:** The system uses a shared database with separate PostgreSQL schemas for each tenant. The `public` schema handles global data (Users, Tenants), while tenant-specific schemas handle exam data.
- **Backend:** [NestJS](https://nestjs.com/) (TypeScript) providing a RESTful API.
- **Frontend:** [Next.js](https://nextjs.org/) (React 18, TypeScript) with Tailwind CSS and Radix UI.
- **Database:** PostgreSQL managed via [Prisma ORM](https://www.prisma.io/).
- **Caching:** Redis via `cache-manager-redis-yet`.
- **Storage:** MinIO (compatible with S3).
- **Authentication:** JWT-based authentication with RBAC (Role-Based Access Control).

## Key Features
- **Global Management:** Super admin can manage tenants and global users.
- **Tenant Management:** Tenant admins can create and manage exams, positions, and subjects.
- **Candidate Portal:** Candidates can register, apply for exams, pay fees, and view results.
- **Review System:** Multi-stage review process for applications.
- **Exam Logistics:** Venue management, seat assignment, and ticket generation.
- **Score Management:** Recording scores and determining interview eligibility.

## Project Structure
- `server/`: NestJS backend.
  - `src/`: Source code.
  - `prisma/`: Database schema and migrations.
- `web/`: Next.js frontend.
  - `src/`: Source code.
  - `openapi/`: API client generated from OpenAPI spec.
- `api-contracts/`: OpenAPI specifications.
- `docs/`: Extensive documentation on various system components and fix reports.

## Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- PostgreSQL
- Redis
- MinIO (or S3-compatible storage)

### Backend (server/)
1. Install dependencies: `npm install`
2. Set up environment variables in `.env`.
3. Run Prisma migrations: `npx prisma migrate dev`
4. Build the project: `npm run build`
5. Run in dev mode: `npm run dev`

### Frontend (web/)
1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Run in dev mode: `npm run dev`
4. Type check: `npm run type-check`

## Development Conventions
- Use TypeScript for all code.
- Follow NestJS patterns for backend (Modules, Controllers, Services).
- Use Tailwind CSS for styling in the frontend.
- API client is generated from the backend OpenAPI spec.

## Testing
- Backend: Jest for unit and e2e tests.
- Frontend: Playwright for e2e and UI-BDD tests, Cucumber for BDD tests.

## gstack

An opinionated collection of AI-powered skills to automate development workflows.

- `/browse`: Fast headless browser for QA and site testing.
- `/qa`: Automated browser-based testing for features and regressions.
- `/review`: In-depth code quality and architectural review.
- `/autoplan`: Complete strategy pipeline (CEO + Design + Eng review).
- `/ship`: End-to-end deployment preparation (PR, changelog, tests).
- `/investigate`: Deep dive into bugs with browser-based reproduction.
- `/office-hours`: Product strategy and framing consultation.
