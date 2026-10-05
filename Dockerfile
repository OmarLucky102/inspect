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
# Stage 2: Production runtime stage
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
