FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm ci --workspaces --include-workspace-root

RUN npm run typecheck

RUN npm run build -w apps/web

FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
