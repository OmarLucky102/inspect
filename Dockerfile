# ==============================================================================
# Stage 1: Build stage
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native C++ addons (bcrypt) and Prisma (openssl)
RUN apk add --no-cache libc6-compat openssl python3 make g++

# Install pnpm
RUN npm install -g pnpm

# Copy package manifests and workspace/npm configurations for caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./

# Install all dependencies (including devDependencies required for building)
RUN pnpm install --frozen-lockfile

# Copy Prisma schema and configuration files
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma Client (builds engine and types for Alpine Linux)
RUN pnpm exec prisma generate

# Copy source code and config files
COPY . .

# Build the NestJS application (outputs to dist/)
RUN pnpm run build

# Prune devDependencies to keep only production dependencies in node_modules
RUN pnpm prune --prod

# ==============================================================================
# Stage 2: Migration stage
# ==============================================================================
# The production stage is built with `pnpm prune --prod`, which removes the
# `prisma` CLI (a devDependency), so migrations cannot run from the app image.
# This stage ships only the pinned Prisma CLI + the schema, and CI pushes it as
# a second digest built from the same commit - migrations therefore always match
# the schema the app was compiled against.
#
# NOTE: prisma.config.ts derives the datasource URL from DB_* variables (NOT
# DATABASE_URL), so every DB_* variable must be supplied to this container.
FROM node:22-alpine AS migration

# PRISMA_VERSION must equal the resolved version in pnpm-lock.yaml, otherwise
# the migration CLI could be a different engine version than the client the app
# was built against. CI resolves it via `node scripts/lock-version.mjs prisma`.
ARG PRISMA_VERSION=7.8.0
ARG DOTENV_VERSION=17.4.2

WORKDIR /app

# dumb-init forwards SIGTERM so `migrate deploy` is not killed mid-transaction.
RUN apk add --no-cache libc6-compat openssl dumb-init

# Prisma's config file imports 'dotenv/config', so dotenv must sit next to it.
RUN npm install --prefix /app --no-save --no-audit --no-fund \
      "prisma@${PRISMA_VERSION}" \
      "dotenv@${DOTENV_VERSION}" \
 && npm cache clean --force \
 && rm -f /app/package-lock.json

COPY prisma ./prisma
COPY prisma.config.ts ./

ENV MIGRATION_CLI=/app/node_modules/.bin/prisma

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "$MIGRATION_CLI migrate deploy"]

# ==============================================================================
# Stage 3: Production runtime stage
# ==============================================================================
FROM node:22-alpine AS production

WORKDIR /app

# Install runtime dependencies for Prisma and dumb-init for proper signal handling
RUN apk add --no-cache libc6-compat openssl dumb-init

# Set production environment variables
ENV NODE_ENV=production
ENV SERVER_PORT=3000

# Ensure the working directory is owned by the unprivileged node user
RUN chown -R node:node /app

# Copy pruned node_modules from builder
COPY --chown=node:node --from=builder /app/node_modules ./node_modules

# Copy compiled application from builder
COPY --chown=node:node --from=builder /app/dist ./dist

# Copy Prisma schema & configuration (needed for migrations and runtime metadata)
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/prisma.config.ts ./

# Copy package.json
COPY --chown=node:node --from=builder /app/package.json ./package.json

# Use non-root node user for security
USER node

# Expose server port (default: 3000)
EXPOSE 3000

# Health check using the NestJS /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVER_PORT:-3000}/health || exit 1

# dumb-init forwards signals (SIGTERM/SIGINT) properly to Node.js for graceful shutdown
ENTRYPOINT ["dumb-init", "--"]

# Entrypoint path matching package.json "start:prod" ("node dist/src/main.js")
CMD ["node", "dist/src/main.js"]
