import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";
import { Round } from "../../domain/round/round.aggregate";

@Injectable()
export class GetCurrentRoundUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
  ) {}

  async execute(): Promise<Round> {
    const round = await this.roundRepository.findLatestUnsettledRound();

    if (!round) {
      throw new NotFoundException("No active round at the moment");
    }

    return round;
  }
}
