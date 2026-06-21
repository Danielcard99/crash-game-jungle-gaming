FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/domain-kit/package.json ./packages/domain-kit/package.json
COPY packages/rabbitmq-kit/package.json ./packages/rabbitmq-kit/package.json
COPY services/wallets/package.json ./services/wallets/package.json

RUN bun install

COPY packages/domain-kit ./packages/domain-kit
COPY packages/rabbitmq-kit ./packages/rabbitmq-kit
COPY services/wallets ./services/wallets

WORKDIR /app/services/wallets

EXPOSE 4002

CMD ["bun", "run", "src/main.ts"]