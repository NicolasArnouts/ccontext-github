# Base image for both building and running
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    git \
    libc6-compat \
    make \
    g++ \
    nano

# Create app directory
WORKDIR /app

# Install Python dependencies
RUN pip install ccontext --break-system-packages

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Copy .env file
COPY .env ./

# Install Node.js dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create a non-root user and switch to it
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

# Set up temp environments
RUN mkdir -p /app/temp_environments
ENV TEMP_ENV_BASE_DIR=/app/temp_environments

# Set environment variables
ENV NODE_ENV production
ENV PATH="/app/node_modules/.bin:$PATH"

EXPOSE 3000

CMD ["npm", "start"]