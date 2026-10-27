# Inspect Backend API

## Project Overview

**Inspect** is a multi-tenant vehicle inspection and workflow management backend service built with NestJS. It provides enterprise capabilities for managing vehicle catalogs, conducting standardized vehicle inspections, tracking status lifecycles, assigning field representatives, and generating structured inspection reports across organizations and financial institutions.

---

## Tech Stack

- **Runtime & Framework**: [Node.js](https://nodejs.org) (v20+ / v24), [NestJS 11](https://nestjs.com) (Express platform)
- **Language**: [TypeScript 5.7](https://www.typescriptlang.org)
- **Database & ORM**: [PostgreSQL 17](https://www.postgresql.org), [Prisma ORM 7](https://www.prisma.io) (multi-file schema with `@prisma/adapter-pg`)
- **Authentication & Security**: Passport JWT, bcrypt, Cookie Parser, Helmet, Throttler rate limiting
- **Storage**: AWS S3 SDK (`@aws-sdk/client-s3`) / Cloudflare R2 compatible object storage
- **Logging**: [Pino](https://github.com/pinojs/pino) (`nestjs-pino`, `pino-http`, `pino-pretty`)
- **Validation**: `class-validator`, `class-transformer`
- **Testing**: Jest, Supertest
- **Package Manager**: [pnpm](https://pnpm.io)
- **Containerization**: Docker, Docker Compose

---

## Prerequisites

- **Docker & Docker Compose** (Required to run all services, database, migrations, and app)
- **Node.js v20+ & pnpm v9+** (Optional, only needed if running tests or linting locally)

---

## Getting Started

The entire stack (PostgreSQL, Prisma migrations & seed, NestJS API, and Frontend) runs directly through Docker Compose.

### 1. Clone & Configure Environment

```bash
git clone <repository-url>
cd inspect
cp .env.example .env
```

Review `.env` and adjust passwords, secrets, or ports if needed.

### 2. Run with Docker Compose

Start the database, run migrations/seed, and launch the application containers in one command:

```bash
# Build and start all services, including automated database migrations & seed
docker compose --profile migration up -d --build
```

### 3. Verify Running Services

Once started, the services are accessible at:
- **NestJS API**: `http://localhost:8000/api/v1`
- **Health Check**: `http://localhost:8000/health`
- **Frontend App**: `http://localhost:80`
- **PostgreSQL**: `localhost:5432`

### 4. Useful Docker Commands

```bash
# View live application logs
docker compose logs -f app

# View migration container output
docker compose logs migration

# Stop all running services
docker compose down

# Stop and wipe persistent database volumes (reset database)
docker compose down -v
```

---

## Available Scripts

Defined in `package.json` for testing, linting, and CI pipelines:

| Script | Command | Description |
|---|---|---|
| `pnpm run build` | `nest build` | Compiles the TypeScript application into `./dist` |
| `pnpm run lint` | `eslint "{src,apps,libs,test}/**/*.ts" --fix` | Runs ESLint and applies automated fixes |
| `pnpm run format` | `prettier --write "src/**/*.ts" "test/**/*.ts"` | Formats code with Prettier |
| `pnpm run test` | `jest` | Runs unit tests |
| `pnpm run test:watch` | `jest --watch` | Runs unit tests in watch mode |
| `pnpm run test:cov` | `jest --coverage` | Generates unit test code coverage report |
| `pnpm run test:e2e` | `jest --config ./test/jest-e2e.json` | Runs end-to-end integration tests |

---

## Project Structure

```
inspect/
├── docs/                 # Extended documentation (architecture, auth, workflows)
├── prisma/               # Database definitions & Prisma configurations
│   ├── migrations/       # SQL migration history
│   ├── models/           # Domain-split Prisma schema files
│   ├── seeds/            # Seed data and domain seeders
│   └── seed.ts           # Root database seed entrypoint
├── src/                  # NestJS application source code
│   ├── bootstrap/        # Application bootstrap & middleware configurations
│   ├── config/           # Typed configuration loaders and validation
│   ├── database/         # Database module and Prisma service wrapper
│   ├── health/           # Health check endpoints (/health)
│   ├── identity/         # Users, roles, permissions, and authentication
│   ├── inspection/       # Inspection requests, workflows, and checklist modules
│   ├── organization/     # Organizations, banks, and branch hierarchies
│   ├── process/          # Process-level uncaught exception handlers
│   ├── shared/           # Cross-cutting guards, filters, interceptors, decorators
│   ├── vehicle/          # Vehicle brands, models, and specifications
│   ├── app.module.ts     # Root module declaring application dependencies
│   └── main.ts           # Application bootstrap and entrypoint
├── test/                 # Test suites (E2E configurations and specs)
├── Dockerfile            # Multi-stage production container build definition
├── docker-compose.yml    # Orchestration configuration for local & container environments
├── package.json          # Project dependencies, metadata, and scripts
└── tsconfig.json         # TypeScript compiler configuration
```
