FROM oven/bun:1-alpine

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile

WORKDIR /app/services/games

EXPOSE 4001

CMD ["sh", "-c", "bunx prisma generate && bunx prisma migrate deploy && bun run src/main.ts"]