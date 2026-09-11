# Forward to inner talent-front directory
FROM node:22-slim AS builder

WORKDIR /app

COPY talent-front/package*.json ./
RUN npm ci

COPY talent-front/ .

ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV NODE_ENV=production

RUN npm run build
RUN npm prune --omit=dev

FROM node:22-slim AS runner

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

RUN groupadd -r -g 10001 nodeuser \
    && useradd -r -u 10001 -g nodeuser -d /app nodeuser

COPY --from=builder --chown=nodeuser:nodeuser /app/package.json ./package.json
COPY --from=builder --chown=nodeuser:nodeuser /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodeuser /app/build ./build

USER nodeuser

EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "build/index.js"]
