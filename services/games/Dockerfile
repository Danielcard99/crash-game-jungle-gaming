FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/domain-kit/package.json ./packages/domain-kit/package.json
COPY packages/rabbitmq-kit/package.json ./packages/rabbitmq-kit/package.json
COPY packages/auth-kit/package.json ./packages/auth-kit/package.json
COPY services/games/package.json ./services/games/package.json

RUN bun install

COPY packages/domain-kit ./packages/domain-kit
COPY packages/rabbitmq-kit ./packages/rabbitmq-kit
COPY packages/auth-kit ./packages/auth-kit
COPY services/games ./services/games

WORKDIR /app/services/games

EXPOSE 4001

CMD ["sh", "-c", "bunx prisma generate && bunx prisma migrate deploy && bun run src/main.ts"]