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

Ensure the following tools are installed on your environment:

- **Node.js**: `v20.18.0+` (or `v24.x`)
- **pnpm**: `v9.x` or higher (`v11.x` recommended)
- **PostgreSQL**: `v16+` or `v17` (or Docker for containerized setup)
- **Docker & Docker Compose**: (Optional, for running containerized infrastructure)

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd inspect
pnpm install
```

### 2. Configure Environment Variables

Create a local `.env` file by copying the example template:

```bash
cp .env.example .env
```

Review and update the variables in `.env` as needed:

| Variable | Description | Default / Example |
|---|---|---|
| `NODE_ENV` | Application environment mode | `development` |
| `SERVER_PORT` | HTTP port for the application | `8000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `secret` |
| `DB_NAME` | PostgreSQL database name | `inspect` |
| `DATABASE_URL` | Full PostgreSQL connection string | `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public` |
| `JWT_SECRET` | Primary JWT signing secret | `<your-jwt-secret>` |
| `JWT_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | `<your-refresh-secret>` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |

### 3. Initialize the Database

Generate the Prisma client, execute migrations, and seed initial records:

```bash
# Generate Prisma Client based on schema definitions
pnpm exec prisma generate

# Apply database migrations
pnpm run migrate

# (Optional) Seed the database with initial reference data
pnpm run seed
```

### 4. Run the Application

```bash
# Development mode with hot reload
pnpm run start:dev

# Debug mode
pnpm run start:debug

# Production build and run
pnpm run build
pnpm run start:prod
```

Once running:
- **API Base URL**: `http://localhost:8000/api/v1`
- **Health Check**: `http://localhost:8000/health`

---

## Available Scripts

Defined in `package.json`:

| Script | Command | Description |
|---|---|---|
| `pnpm run build` | `nest build` | Compiles the TypeScript application into `./dist` |
| `pnpm run start` | `nest start` | Starts the application in standard mode |
| `pnpm run start:dev` | `nest start --watch` | Starts the application with file watching and live reload |
| `pnpm run start:debug` | `nest start --debug --watch` | Starts with debugger inspector and watch mode |
| `pnpm run start:prod` | `node dist/src/main.js` | Runs the compiled production distribution |
| `pnpm run migrate` | `prisma migrate dev` | Applies Prisma migrations in development mode |
| `pnpm run seed` | `prisma db seed` | Executes the database seed script (`prisma/seed.ts`) |
| `pnpm run format` | `prettier --write "src/**/*.ts" "test/**/*.ts"` | Formats code with Prettier |
| `pnpm run lint` | `eslint "{src,apps,libs,test}/**/*.ts" --fix` | Runs ESLint and applies automated fixes |
| `pnpm run test` | `jest` | Runs unit tests |
| `pnpm run test:watch` | `jest --watch` | Runs unit tests in watch mode |
| `pnpm run test:cov` | `jest --coverage` | Generates unit test code coverage report |
| `pnpm run test:debug` | `node --inspect-brk ...` | Runs tests with Node debugger |
| `pnpm run test:e2e` | `jest --config ./test/jest-e2e.json` | Runs end-to-end integration tests |

---

## Docker Setup

The project includes a multi-service `docker-compose.yml` supporting PostgreSQL, the NestJS API, database migrations, and the frontend service.

### 1. Start Services

To launch PostgreSQL, the NestJS backend, and the frontend:

```bash
# Start all core services in detached mode
docker compose up -d

# View application logs
docker compose logs -f app
```

### 2. Run Database Migrations in Docker

A dedicated `migration` container profile is configured to run Prisma migrations and seeds safely:

```bash
# Execute migrations and seeds against the database container
docker compose --profile migration up migration
```

### 3. Stop Services

```bash
# Stop and remove containers and networks
docker compose down

# Stop and remove associated database volumes
docker compose down -v
```

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
