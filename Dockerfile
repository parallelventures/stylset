FROM node:20-alpine

WORKDIR /app

# Copy package files AND prisma schema (needed by postinstall)
COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy rest of app
COPY . .

# Build
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
