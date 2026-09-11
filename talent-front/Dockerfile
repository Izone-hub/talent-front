# ============================================================
# Stage 1: Build SvelteKit application
# ============================================================
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build-time argument for API base URL (can be overridden during build)
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV NODE_ENV=production

# Build standalone Node application via @sveltejs/adapter-node
RUN npm run build

# Remove development dependencies to keep final bundle lean
RUN npm prune --omit=dev

# ============================================================
# Stage 2: Minimal Production Runtime
# ============================================================
FROM node:22-slim AS runner

WORKDIR /app

# Install curl for container health check
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Runtime environment settings
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Create dedicated non-root system user and group
RUN groupadd -r -g 10001 nodeuser \
    && useradd -r -u 10001 -g nodeuser -d /app nodeuser

# Copy production artifacts from builder stage
COPY --from=builder --chown=nodeuser:nodeuser /app/package.json ./package.json
COPY --from=builder --chown=nodeuser:nodeuser /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodeuser /app/build ./build

USER nodeuser

EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "build/index.js"]
