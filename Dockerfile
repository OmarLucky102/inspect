# ==============================================================================
# Stage 1: Base — OS packages + pnpm + Puppeteer (cached permanently)
# This is the ONLY stage that installs Chromium and system packages.
# ==============================================================================
FROM node:24-bookworm-slim AS base

WORKDIR /app

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

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm install -g pnpm@10.5.2

ENV PNPM_STORE_DIR=/root/.local/share/pnpm/store \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# ==============================================================================
# Stage 2: Builder — install deps + compile TS + prisma generate
# Also used as target for migration service (has pnpm + ts-node available).
# Cached as long as package.json / pnpm-lock.yaml / prisma schema don't change.
# ==============================================================================
FROM base AS builder

# Install dependencies (cached layer)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --prefer-frozen-lockfile

# Generate Prisma client
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm exec prisma generate

# Copy source and compile
COPY . .
RUN pnpm run build

# Prune devDependencies in-place (saves copying to a separate stage)
RUN cp -R node_modules/.prisma /tmp/.prisma 2>/dev/null || true
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm prune --prod
RUN if [ -d /tmp/.prisma ]; then cp -R /tmp/.prisma node_modules/.prisma; fi

# ==============================================================================
# Stage 3: Production — inherits base (NO re-apt-get, no duplicate Chromium)
# ==============================================================================
FROM base AS production

ARG PORT=18080
ENV NODE_ENV=production \
    PORT=${PORT} \
    SERVER_PORT=${PORT}

RUN chown node:node /app

# Copy only what is needed to run the app
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --chown=node:node --from=builder /app/package.json ./package.json

USER node

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVER_PORT}/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
