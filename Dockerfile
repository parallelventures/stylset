FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source
COPY . .

# Build
RUN npm run build

# Create data directory
RUN mkdir -p data/subjects data/sets

EXPOSE 3000

ENV NODE_ENV=production
ENV DATABASE_URL="file:./prisma/dev.db"

# Initialize DB and start
CMD npx prisma db push --skip-generate && npm start
