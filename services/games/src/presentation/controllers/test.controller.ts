import { Controller, Post } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";
import { Round } from "../../domain/round/round.aggregate";
import { hashSeed, calculateCrashPoint } from "../../domain/provably-fair/provably-fair.service";

@Controller("test")
export class TestController {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
  ) {}

  @Post("seed-round")
  async seedRound() {
    const serverSeed = "test-seed-deterministic-e2e";
    const clientSeed = "test-client-seed-e2e";
    const serverSeedHash = hashSeed(serverSeed);
    const nonce = 0;
    const crashPoint = calculateCrashPoint(serverSeed, nonce, 1, clientSeed);

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
