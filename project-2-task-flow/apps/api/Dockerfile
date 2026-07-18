FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN npm ci --workspaces --include-workspace-root

RUN npm run build -w apps/api

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]