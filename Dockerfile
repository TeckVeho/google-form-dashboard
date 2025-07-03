# Base image
FROM node:22-alpine AS base

# Cài bash và pnpm (thay vì dùng corepack)
RUN apk add --no-cache bash \
    && npm install -g pnpm@10.12.3  # hoặc bản bạn muốn, có thể dùng latest

# Stage 1: Cài dependencies
FROM base AS deps
WORKDIR /app

# Copy lockfile và package.json
COPY package.json pnpm-lock.yaml ./

# Cài dependencies (không thay đổi lockfile)
RUN pnpm install --frozen-lockfile

# Stage 2: Build ứng dụng
FROM base AS builder
WORKDIR /app

# Copy node_modules từ deps
COPY --from=deps /app/node_modules ./node_modules

# Copy toàn bộ mã nguồn
COPY . .

# Build app (Next.js)
RUN pnpm run build

# Stage 3: Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Tạo user không phải root
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Tạo thư mục .next và phân quyền
RUN mkdir .next && chown nextjs:nodejs .next

# Copy các file build và runtime cần thiết
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/app ./app
COPY --from=builder --chown=nextjs:nodejs /app/components ./components
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3020
ENV PORT=3020
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]
