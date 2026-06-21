import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { ROUND_REPOSITORY } from "../domain/round/round.repository";
import { BET_REPOSITORY } from "../domain/bet/bet.repository";
import { PrismaRoundRepository } from "./round/prisma-round.repository";
import { PrismaBetRepository } from "./bet/prisma-bet.repository";

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: ROUND_REPOSITORY, useClass: PrismaRoundRepository },
    { provide: BET_REPOSITORY, useClass: PrismaBetRepository },
  ],
  exports: [ROUND_REPOSITORY, BET_REPOSITORY],
})
export class RepositoriesModule {}
