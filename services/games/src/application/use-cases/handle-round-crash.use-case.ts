import { Inject, Injectable } from "@nestjs/common";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";
import {
  BET_REPOSITORY,
  type BetRepository,
} from "../../domain/bet/bet.repository";
import { Round } from "../../domain/round/round.aggregate";

@Injectable()
export class HandleRoundCrashUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
  ) {}

  async execute(round: Round): Promise<void> {
    round.crash();
    await this.roundRepository.save(round);

    const activeBets = await this.betRepository.findActiveBetsByRoundId(
      round.id,
    );
    for (const bet of activeBets) {
      bet.markAsLost();
      await this.betRepository.save(bet);
    }

    round.settle();
    await this.roundRepository.save(round);
  }
}
