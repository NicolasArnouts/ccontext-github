FROM node:22 AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates

# 1. Copy just package*.json (for caching npm ci) + prisma
COPY package*.json ./
COPY prisma ./prisma

# 2. Install dependencies (postinstall will now succeed since prisma is present)
RUN npm ci

# 3. Copy remaining source code
COPY . .

# 4. Generate Prisma client & build
RUN npx prisma generate
RUN npm run build

# ---------- Final Stage ----------
FROM node:22
WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    pipx \
    git \
    openssl \
    ca-certificates \
    nano

# Copy production artifacts from builder
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/prisma /app/prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env ./

# --- User and Directory Setup (AS ROOT) ---
# 1. Create the base temp directory and add the user.  adduser creates /home/nextjs
RUN mkdir -p /app/temp_environments \
    && addgroup --gid 1001 nodejs \
    && adduser --uid 1001 --ingroup nodejs --disabled-password --gecos "" nextjs

# 2. *NOW* create the pipx directories, *AFTER* adduser has run.
RUN mkdir -p /home/nextjs/.local/bin \
    && mkdir -p /home/nextjs/.local/pipx/logs \
    && chown -R nextjs:nodejs /home/nextjs/.local \
    && chown -R nextjs:nodejs /app \
    && chmod -R 755 /app/temp_environments

# --- Switch to nextjs user ---
USER nextjs
ENV HOME=/home/nextjs
ENV PATH="$HOME/.local/bin:$PATH"

# --- Install ccontext AS the nextjs user ---
RUN pipx ensurepath
RUN pipx install ccontext
RUN pipx ensurepath

# --- Environment Variables ---
ENV NODE_ENV=production
ENV TEMP_ENV_BASE_DIR=/app/temp_environments

EXPOSE 3000

CMD ["npm", "start"]