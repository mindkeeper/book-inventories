FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json .
RUN npm ci

# Copy source and prisma files
COPY tsconfig*.json .
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client and build the app
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

# Copy package files and install prod deps
COPY package*.json .
RUN npm ci --omit=dev && npm i prisma --no-save

# Copy built app and prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run migrations on startup and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]