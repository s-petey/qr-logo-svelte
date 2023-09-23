FROM oven/bun AS builder
WORKDIR /app
COPY package.json .
COPY bun.lockb .
RUN bun install
COPY . .
RUN bun run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]