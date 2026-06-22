import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";
import { RoundStatus } from "../../domain/round/round-status.enum";
import { Round } from "../../domain/round/round.aggregate";

@Injectable()
export class VerifyRoundUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
  ) {}

  async execute(roundId: string): Promise<Round> {
    const round = await this.roundRepository.findById(roundId);

    if (!round) {
      throw new NotFoundException("Round not found");
    }

    if (round.status !== RoundStatus.SETTLED) {
      throw new ConflictException(
        "Round is not finished yet, seed not revealed",
      );
    }

    return round;
  }
}
