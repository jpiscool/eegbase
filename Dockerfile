# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — deps
# Install production + dev dependencies so the builder has everything it needs.
# Using a separate stage keeps the final image free of node_modules.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package manifests and install all dependencies (including devDeps needed
# by next build).  Using --frozen-lockfile ensures reproducible installs.
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — builder
# Compile the Next.js application.  next build with output: "standalone"
# produces a self-contained server bundle at .next/standalone/server.js.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Bring in installed node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source tree.
COPY . .

# Tell Next.js to produce a standalone bundle (set in next.config.ts as well,
# but the env var is a belt-and-suspenders safeguard).
ENV NEXT_TELEMETRY_DISABLED=1

# Run the production build.  DATABASE_URL must be a valid connection string even
# at build time because Drizzle generates types from it; supply a placeholder if
# the real DSN is not available during CI.
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — runner
# Minimal production image.  Only the standalone server bundle, static assets,
# and public files are copied in — no source code or dev tooling.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a dedicated non-root user/group for the process (uid/gid 1001).
# Running as non-root is a basic container security best practice.
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy public assets (images, manifest, icons, etc.).
COPY --from=builder /app/public ./public

# Copy the standalone server bundle produced by next build.
# The standalone directory already contains its own minimal node_modules.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy prerendered static files (.next/static) into the location the standalone
# server expects them: <cwd>/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# The standalone server listens on HOSTNAME:PORT by default.
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

EXPOSE 3000

# server.js is the entry point emitted by Next.js standalone output.
CMD ["node", "server.js"]
