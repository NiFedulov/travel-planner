# syntax=docker/dockerfile:1.7
# Multi-stage build для Next.js standalone output.
# - deps: только prod deps + prisma generate
# - build: dev deps + next build
# - runtime: distroless-style alpine, non-root

# ---- deps ----
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
# --ignore-scripts: блокируем supply-chain атаки через postinstall
# Prisma generate запустим отдельно ниже
RUN npm ci --ignore-scripts

# ---- builder ----
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma generate — нужен после COPY . . чтобы schema.prisma был на месте
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Build args для prod URL (передаются через --build-arg)
ARG NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}
RUN npm run build

# ---- runtime ----
FROM node:22-alpine AS runtime
RUN apk add --no-cache libc6-compat openssl tini

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output (next.config.ts: output: 'standalone') + статика
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Generated prisma client уже включён в node_modules standalone

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:3000/api/health || exit 1

# tini PID 1 — корректно reaps zombie процессы
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
