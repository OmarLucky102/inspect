# ==============================================================================
# Stage 1: Base image with all OS dependencies (Cached permanently)
# ==============================================================================
FROM node:24-bookworm-slim AS base

WORKDIR /app

# Install all system-level runtime & build tools ONCE at the top:
# - Chromium & fonts for Puppeteer PDF reporting
# - ffmpeg for media processing
# - openssl & dumb-init for secure execution and graceful termination
# - python3, make, g++ for native node module compilation (bcrypt, prisma)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    dumb-init \
    ffmpeg \
    wget \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-dejavu-core \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Enable pnpm via corepack (pinned to packageManager in package.json)
RUN corepack enable

# Explicit deterministic pnpm store path & Puppeteer configuration
ENV PNPM_STORE_DIR=/root/.local/share/pnpm/store \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# ==============================================================================
# Stage 2: Dependencies (Cached based ONLY on package.json & pnpm-lock.yaml)
# ==============================================================================
FROM base AS dependencies

# Cache package dependencies with BuildKit pnpm store cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy Prisma schema and generate client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm exec prisma generate

# ==============================================================================
# Stage 3: Development (Target for local dev in docker-compose.yml)
# Fast rebuilds: OS packages and pnpm modules are 100% cached.
# ==============================================================================
FROM dependencies AS development

ARG PORT=18080
ENV NODE_ENV=development \
    PORT=${PORT} \
    SERVER_PORT=${PORT}

# Copy full application source
COPY . .

EXPOSE ${PORT}

# Health check against dynamic port
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVER_PORT}/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "run", "start:dev"]

# ==============================================================================
# Stage 4: Builder (Compiles TypeScript app for production)
# ==============================================================================
FROM dependencies AS builder

COPY . .
RUN pnpm run build

# ==============================================================================
# Stage 5: Prune devDependencies while safeguarding generated Prisma client
# ==============================================================================
FROM builder AS prod-deps

# Backup generated Prisma client before pruning devDependencies
RUN cp -R node_modules/.prisma /tmp/.prisma 2>/dev/null || true

# Prune devDependencies to keep production image lightweight
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm prune --prod

# Guarantee generated Prisma client is restored if pruned by pnpm
RUN if [ -d /tmp/.prisma ]; then cp -R /tmp/.prisma node_modules/.prisma; fi

# ==============================================================================
# Stage 6: Production runtime stage
# ==============================================================================
FROM node:24-bookworm-slim AS production

WORKDIR /app

# Install runtime dependencies, Chromium for Puppeteer, and dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    dumb-init \
    ffmpeg \
    wget \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Configurable port (override via --build-arg PORT=<port> or env SERVER_PORT=<port>)
ARG PORT=18080
ENV NODE_ENV=production \
    PORT=${PORT} \
    SERVER_PORT=${PORT} \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy pruned dependencies from prod-deps stage
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules

# Copy compiled application & runtime schema from builder
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/package.json ./package.json

# Run as non-root user
USER node

# Expose dynamic application port
EXPOSE ${PORT}

# Health check against dynamic port
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVER_PORT}/health || exit 1

# Graceful termination handler & start command
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
