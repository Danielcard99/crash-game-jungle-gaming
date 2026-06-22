import { Controller, Post } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";
import { Round } from "../../domain/round/round.aggregate";
import { hashSeed } from "../../domain/provably-fair/provably-fair.service";

@Controller("test")
export class TestController {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
  ) {}

  @Post("seed-round")
  async seedRound() {
    const serverSeed = "test-seed-deterministic-e2e";
    const serverSeedHash = hashSeed(serverSeed);
    const crashPoint = 1.5;

    const round = Round.create({
      serverSeed,
      serverSeedHash,
      crashPoint,
      bettingWindowSeconds: 10,
    });

    await this.roundRepository.save(round);

    return {
      roundId: round.id,
      crashPoint,
      serverSeedHash,
      bettingEndsAt: round.bettingEndsAt,
    };
  }
}
