FROM node:20-alpine AS base

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY src ./src

ENV NODE_ENV=production

USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]
