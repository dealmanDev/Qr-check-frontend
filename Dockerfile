FROM node:20-bookworm-slim AS builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:3000
ARG VITE_APP_NAME=Smart QR Check

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-bookworm-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY server.js ./server.js

EXPOSE 80

CMD ["node", "server.js"]
