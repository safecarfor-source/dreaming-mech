# Stage 1: Install production dependencies + generate Prisma Client
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies (sharp prebuilt binary for linux-x64-musl)
RUN npm ci --only=production --os=linux --cpu=x64

# Generate Prisma Client into node_modules
RUN npx prisma generate

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --os=linux --cpu=x64

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS application
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache dumb-init vips font-noto-cjk

RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

# Copy production node_modules (with Prisma Client) from deps stage
COPY --from=deps --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=deps --chown=nestjs:nestjs /app/prisma ./prisma

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/package*.json ./

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start:prod"]
