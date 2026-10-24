# Cloud Run Production Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json tsconfig*.json vite.config.ts index.html ./
RUN npm ci

# Copy source files and build frontend
COPY src ./src
COPY public ./public
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --only=production

# Copy server code, public assets, and built frontend
COPY server ./server
COPY public ./public
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "server/server.js"]
