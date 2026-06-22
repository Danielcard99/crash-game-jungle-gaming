import { Controller, Post, Body } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";
import { Round } from "../../domain/round/round.aggregate";
import { hashSeed } from "../../domain/provably-fair/provably-fair.service";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Controller("test")
export class TestController {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Post("seed-round")
  async seedRound(@Body() body?: { crashPoint?: number }) {
    // Remove rounds presos em BETTING (e suas apostas) para garantir isolamento entre testes
    const stuckRounds = await this.prisma.round.findMany({
      where: { status: "BETTING" },
      select: { id: true },
    });
    if (stuckRounds.length > 0) {
      const ids = stuckRounds.map((r) => r.id);
      await this.prisma.bet.deleteMany({ where: { roundId: { in: ids } } });
      await this.prisma.round.deleteMany({ where: { id: { in: ids } } });
    }

    const serverSeed = "test-seed-deterministic-e2e";
    const clientSeed = "test-client-seed-e2e";
    const serverSeedHash = hashSeed(serverSeed);
    const nonce = 0;
    const crashPoint = body?.crashPoint ?? 1.5;

    const round = Round.create({
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
      crashPoint,
      bettingWindowSeconds: 10,
    });

    await this.roundRepository.save(round);

    return {
      roundId: round.id,
      crashPoint,
      serverSeedHash,
      clientSeed,
      nonce,
      bettingEndsAt: round.bettingEndsAt,
    };
  }
}
