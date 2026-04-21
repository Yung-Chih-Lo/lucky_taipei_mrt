# syntax=docker/dockerfile:1.6

# ───── Stage 1: prod deps ──────────────────────────────────────────────
# Compiles native modules (better-sqlite3, @node-rs/argon2) for the final
# runtime image.
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ───── Stage 2: builder ────────────────────────────────────────────────
# Full deps (including devDependencies) so `next build` has TypeScript
# and the Next.js lint/type-check pipeline.
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ───── Stage 3: runner ─────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/metro.db

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Runtime needs: the production node_modules tree (with compiled native
# bindings), Next.js build output, static assets, DB code, migrations,
# seed data, and the entrypoint.
COPY --from=deps    /app/node_modules       ./node_modules
COPY --from=builder /app/.next              ./.next
COPY --from=builder /app/public             ./public
COPY --from=builder /app/package.json       ./package.json
COPY --from=builder /app/next.config.mjs    ./next.config.mjs
COPY --from=builder /app/tsconfig.json      ./tsconfig.json
COPY --from=builder /app/drizzle.config.ts  ./drizzle.config.ts
COPY --from=builder /app/drizzle            ./drizzle
COPY --from=builder /app/db                 ./db
COPY --from=builder /app/lib                ./lib
COPY --from=builder /app/scripts            ./scripts

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
