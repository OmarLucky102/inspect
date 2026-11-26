# ==============================================================================
# Stage 1: Build stage (Node.js 24 Debian Linux + pnpm via corepack)
# ==============================================================================
# Build context: . (repo root) — filtered by frontend/Dockerfile.dockerignore
# COPY paths are relative to the repo root.
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Use corepack (ships with Node 24) instead of npm install -g pnpm.
# Avoids a network round-trip; no outbound download for pnpm@10.5.2.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate

# Deterministic pnpm content-addressable store; shared across builds via cache mount.
ENV PNPM_STORE_DIR=/root/.local/share/pnpm/store

# ── Layer 1: workspace manifests + lockfile only ──────────────────────────────
# Only these files trigger a dependency reinstall.
# Backend source changes (src/, prisma/, etc.) never reach this layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
COPY frontend/package.json ./frontend/

# ── Layer 2: install (cached pnpm store survives rebuilds) ────────────────────
# .npmrc already configures shamefully-hoist=true.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm --filter frontend install --prefer-frozen-lockfile

# ── Layer 3: frontend source (only invalidated when frontend/src changes) ──────
# frontend/Dockerfile.dockerignore excludes frontend/node_modules and dist so
# this COPY never overwrites the container's /app/frontend/node_modules.
COPY frontend ./frontend

# Configurable build-time API base URL & CDN asset URL
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}
ARG VITE_CDN_URL
ENV VITE_CDN_URL=${VITE_CDN_URL}

# ── Layer 4: build (cache mounts persist .vite/ and .tmp/ tsbuildinfo) ────────
# Run via pnpm --filter frontend so it uses /app/frontend/node_modules/.bin/tsc
# (TypeScript 6.0.3) instead of root's /app/node_modules/.bin/tsc (5.9.3).
RUN --mount=type=cache,id=vite-cache-frontend,target=/app/frontend/node_modules/.vite \
    --mount=type=cache,id=tsbuild-cache-frontend,target=/app/frontend/node_modules/.tmp \
    pnpm --filter frontend run build

# ==============================================================================
# Stage 2: Production Nginx runtime
# ==============================================================================
FROM nginx:1.27-alpine AS production

# Remove default static files and configurations
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy production build artifacts from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Expose default HTTP port
EXPOSE 80

# Health check against Nginx health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/nginx-health || exit 1

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
