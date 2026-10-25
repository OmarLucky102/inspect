# ==============================================================================
# Stage 1: Build stage (full dependencies for compilation & migration service)
# ==============================================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Install native dependencies required for building bcrypt and Prisma
RUN apk add --no-cache libc6-compat openssl python3 make g++

# Enable pnpm
RUN npm install -g pnpm

# Cache package dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
RUN pnpm install --frozen-lockfile

# Copy Prisma schema and generate client for Alpine Linux
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm exec prisma generate

# Copy source and compile NestJS app
COPY . .
RUN pnpm run build

# ==============================================================================
# Stage 2: Prune devDependencies while safeguarding generated Prisma client
# ==============================================================================
FROM builder AS prod-deps

# Backup generated Prisma client before pruning devDependencies
RUN cp -R node_modules/.prisma /tmp/.prisma 2>/dev/null || true

# Prune devDependencies to keep production image lightweight
RUN pnpm prune --prod

# Guarantee generated Prisma client is restored if pruned by pnpm
RUN if [ -d /tmp/.prisma ]; then cp -R /tmp/.prisma node_modules/.prisma; fi

# ==============================================================================
# Stage 3: Production runtime stage
# ==============================================================================
FROM node:24-alpine AS production

WORKDIR /app

# Install runtime dependencies and dumb-init for proper signal handling
RUN apk add --no-cache libc6-compat openssl dumb-init

# Configurable port (override via --build-arg PORT=<port> or env SERVER_PORT=<port>)
ARG PORT=8000
ENV NODE_ENV=production \
    PORT=${PORT} \
    SERVER_PORT=${PORT}

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
