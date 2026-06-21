import { Injectable, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";
import {
  BET_REPOSITORY,
  type BetRepository,
} from "../../domain/bet/bet.repository";
import { Bet } from "../../domain/bet/bet.aggregate";
import { BetAmount } from "../../domain/bet/bet-amount.value-object";
import { RoundStatus } from "../../domain/round/round-status.enum";
import { BET_EVENTS, type BetPlacedEvent } from "@crash/rabbitmq-kit";

@Injectable()
export class PlaceBetUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
    @Inject("WALLETS_CLIENT") private readonly walletsClient: ClientProxy,
  ) {}

  async execute(params: {
    roundId: string;
    playerId: string;
    playerUsername: string;
    amountInCents: bigint;
  }): Promise<Bet> {
    const round = await this.roundRepository.findById(params.roundId);

    if (!round) {
      throw new Error("Round not found");
    }

    if (round.status !== RoundStatus.BETTING) {
      throw new Error("Round is not in betting phase");
    }

    const existingBet = await this.betRepository.findByRoundIdAndPlayerId(
      params.roundId,
      params.playerId,
    );

    if (existingBet) {
      throw new Error("Player already placed a bet in this round");
    }

    const amountBet = BetAmount.create(params.amountInCents);

    const bet = Bet.create({
      roundId: params.roundId,
      playerId: params.playerId,
      playerUsername: params.playerUsername,
      amountBet,
    });

    await this.betRepository.save(bet);

    const event: BetPlacedEvent = {
      betId: bet.id,
      playerId: bet.playerId,
      amount: Number(amountBet.valueInCents),
    };

    this.walletsClient.emit(BET_EVENTS.PLACED, event);

    return bet;
  }
}
