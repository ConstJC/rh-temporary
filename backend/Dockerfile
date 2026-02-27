# Stage 1: Base stage with Node.js Alpine image
FROM node:20-alpine AS base

# Stage 2: Builder stage starts from the base image
FROM base AS builder

# Install libc6-compat and openssl for compatibility
RUN apk add --no-cache libc6-compat openssl

# Set the working directory for subsequent instructions
WORKDIR /builder

# Copy package.json and package-lock.json to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies as per lock file without making updates
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Prune development dependencies
RUN npm prune --production

# Stage 3: Runner stage starts from the base image again
FROM base AS runner

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Set the working directory in the container
WORKDIR /runner

# Create a non-root group and user for running the application securely
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 jcode

# Copy Prisma schema and generated client
COPY --from=builder --chown=jcode:nodejs /builder/prisma ./prisma
COPY --from=builder --chown=jcode:nodejs /builder/node_modules/.prisma ./node_modules/.prisma

# Copy installed node_modules and built artifacts from the builder stage
# Change ownership to the non-root user and group created above
COPY --from=builder --chown=jcode:nodejs /builder/node_modules ./node_modules
COPY --from=builder --chown=jcode:nodejs /builder/dist ./dist
COPY --from=builder --chown=jcode:nodejs /builder/package.json ./package.json

# Switch to non-root user for security
USER jcode

# Inform Docker that the container is listening on port 3000 at runtime
EXPOSE 3000

# Define the command to run the app
CMD ["node", "dist/main.js"]
