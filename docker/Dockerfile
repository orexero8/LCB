# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && \
    cp -R node_modules /prod_modules && \
    npm ci

# Stage 2: Build the app
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Production image
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache tini postgresql-client

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy production node_modules (no dev deps)
COPY --from=deps /prod_modules ./node_modules

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./

# Copy schema & seed scripts
COPY --from=builder /app/data/schema.sql ./data/schema.sql
COPY --from=builder /app/data/apply-schema.mjs ./data/apply-schema.mjs
COPY --from=builder /app/data/seed-raw.mjs ./data/seed-raw.mjs

# Copy generated Prisma client
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint
COPY docker/scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/entrypoint.sh"]
