FROM node:22-alpine AS builder

WORKDIR /app

# Cài đặt công cụ cần thiết
RUN apk add --no-cache openssl python3 make g++

# Sao chép file cấu hình monorepo
COPY package.json package-lock.json* pnpm-workspace.yaml* ./
COPY backend/package.json ./backend/

# Cài đặt dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY backend ./backend

# Khởi tạo Prisma client
WORKDIR /app/backend
RUN npx prisma generate

EXPOSE 3001

CMD ["npx", "tsx", "src/server.ts"]
