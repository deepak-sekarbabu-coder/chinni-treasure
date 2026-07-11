# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only dependency manifests first for better layer caching
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies (triggers prisma generate via postinstall)
RUN npm ci

# ---- Stage 2: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build-time args for NEXT_PUBLIC_* variables (inlined at build time by Next.js)
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (explicit, in case postinstall was skipped)
RUN npx prisma generate

# Build Next.js in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ---- Stage 3: Production ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dumb-init for proper signal handling in containers
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Use dumb-init to forward signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the Next.js production server
USER nextjs
CMD ["node", "server.js"]
