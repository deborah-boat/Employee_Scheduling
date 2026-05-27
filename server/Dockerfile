# ── Stage 1: Install production dependencies & generate Prisma client ────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copy package manifests — Docker caches this layer until they change
COPY package.json package-lock.json* ./

# Copy the Prisma schema so prisma generate can read it
COPY prisma/schema.prisma ./prisma/schema.prisma

# Install only production dependencies (skips tsx, nodemon, vitest)
RUN npm install --omit=dev

# Generate the Prisma Client from schema.prisma into node_modules
RUN npx prisma generate

# ── Stage 2: Final runtime image ─────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Copy installed modules (including generated Prisma client) from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files — .dockerignore keeps .env and node_modules out
COPY . .

EXPOSE 4000

# Start with plain Node — no nodemon, no tsx, no locally installed Node.js needed
CMD ["node", "index.js"]
