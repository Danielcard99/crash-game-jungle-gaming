-- AlterTable
ALTER TABLE "Round" ADD COLUMN "clientSeed" TEXT NOT NULL DEFAULT '',
                    ADD COLUMN "nonce"       INTEGER NOT NULL DEFAULT 0;
