# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/web/package*.json ./packages/web/

# Install dependencies
RUN npm ci && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the shared package first as backend depends on it
RUN npm run build --workspace=@vangarments/shared

# Build the backend application
RUN npm run build --workspace=@vangarments/backend

# Debug: show full dist folder tree structure
RUN find packages/backend/dist -type f -name "*.js" | head -30

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 vangarments

# Copy built application
COPY --from=builder --chown=vangarments:nodejs /app/packages/backend/dist ./dist
COPY --from=builder --chown=vangarments:nodejs /app/packages/backend/package*.json ./
COPY --from=deps --chown=vangarments:nodejs /app/node_modules ./node_modules

# Copy database initialization scripts
COPY --from=builder --chown=vangarments:nodejs /app/packages/backend/database ./database

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Switch to non-root user
USER vangarments

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/backend/index.js"]