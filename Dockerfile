FROM oven/bun:1-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++ pkgconfig

COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/game/package.json ./packages/game/

RUN bun install --production

COPY server ./server
COPY packages/game ./packages/game

EXPOSE 3001
ENV PORT=3001

CMD ["bun", "server/index.js"]
