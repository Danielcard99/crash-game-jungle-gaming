-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('BETTING', 'RUNNING', 'CRASHED', 'SETTLED');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'ACTIVE', 'CASHED_OUT', 'LOST', 'REJECTED');

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "status" "RoundStatus" NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "crashPoint" DECIMAL(65,30) NOT NULL,
    "bettingStartedAt" TIMESTAMP(3) NOT NULL,
    "bettingEndsAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "crashedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerUsername" TEXT NOT NULL,
    "amountBet" DECIMAL(65,30) NOT NULL,
    "status" "BetStatus" NOT NULL,
    "cashoutMultiplier" DECIMAL(65,30),
    "payout" DECIMAL(65,30),
    "placedAt" TIMESTAMP(3) NOT NULL,
    "cashedOutAt" TIMESTAMP(3),

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bet_playerId_idx" ON "Bet"("playerId");

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
