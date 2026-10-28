# ==============================================================================
# Stage 1: Build stage (Node.js 24 Alpine + pnpm)
# ==============================================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN npm install -g pnpm

# Copy root workspace manifests & lockfile for caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
COPY frontend/package.json ./frontend/

# Install dependencies using frozen lockfile for frontend package (admin)
RUN pnpm --filter admin install --frozen-lockfile

# Copy frontend source code and configs
COPY frontend ./frontend

WORKDIR /app/frontend

# Configurable build-time API base URL (defaults to relative /api/v1 for Nginx reverse-proxy)
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

# Build production assets (outputs to /app/frontend/dist)
RUN pnpm run build

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
