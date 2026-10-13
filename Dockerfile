# ==========================================
# Stage 1: Build stage
# ==========================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install dependencies required by Prisma engine & build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests & prisma schema first for optimal layer caching
COPY app/package*.json ./
COPY app/prisma ./prisma/

# Set dummy DATABASE_URL and increased memory limit for building Nuxt
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install all dependencies (including devDependencies required for build)
RUN npm ci

# Copy application source code from app/
COPY app/ ./

# Generate Prisma Client & build Nuxt application
RUN npx prisma generate
RUN npm run build

# ==========================================
# Stage 2: Production runtime
# ==========================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Install runtime dependencies (OpenSSL for Prisma engine & curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set production environment variables
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV PORT=3000

# Copy compiled Nuxt output from builder stage
COPY --from=builder --chown=node:node /app/.output ./.output

# Copy Prisma schema for runtime reference
COPY --from=builder --chown=node:node /app/prisma ./prisma

# Use non-root node user for container security
USER node

# Expose default Nuxt port
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || curl -f http://localhost:3000/ || exit 1

# Start Nuxt Nitro production server
CMD ["node", ".output/server/index.mjs"]
