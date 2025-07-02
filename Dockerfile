FROM node:24 AS base

RUN apk add --no-cache bash

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json và package-lock.json vào thư mục làm việc
COPY package.json yarn.lock* package-lock.json* ./

# Cài đặt dependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies từ stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copy toàn bộ mã nguồn vào /app
COPY . .

# Build ứng dụng
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Tạo user cho việc chạy ứng dụng
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set permission cho thư mục .next
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy tệp cần thiết từ builder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/ ./


USER nextjs

EXPOSE 3020

ENV PORT=3020

# Set hostname và start command
ENV HOSTNAME="0.0.0.0"
CMD ["npm", "start"]
