import {
  Injectable,
  Inject,
  ServiceUnavailableException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
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
import {
  BET_EVENTS,
  type EventPublisher,
  type BetPlacedEvent,
} from "@crash/rabbitmq-kit";
import type { LocalEventEmitter } from "../events/local-event-emitter";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class PlaceBetUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
    @Inject("WALLETS_CLIENT") private readonly walletsClient: EventPublisher,
    @Inject(EventEmitter2) private readonly eventEmitter: LocalEventEmitter,
  ) {}

  async execute(params: {
    playerId: string;
    playerUsername: string;
    amountInCents: bigint;
    autoCashoutMultiplier?: number | null;
  }): Promise<Bet> {
    const round = await this.roundRepository.findCurrentBettingRound();

    if (!round) {
      throw new ServiceUnavailableException(
        "No round is currently accepting bets",
      );
    }

    if (round.status !== RoundStatus.BETTING) {
      throw new ConflictException("Round is not in betting phase");
    }

    const existingBet = await this.betRepository.findByRoundIdAndPlayerId(
      round.id,
      params.playerId,
    );

    if (existingBet) {
      throw new ConflictException("Player already placed a bet in this round");
    }

    let amountBet: BetAmount;
    try {
      amountBet = BetAmount.create(params.amountInCents);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }

    const bet = Bet.create({
      roundId: round.id,
      playerId: params.playerId,
      playerUsername: params.playerUsername,
      amountBet,
      autoCashoutMultiplier: params.autoCashoutMultiplier ?? null,
    });

    await this.betRepository.save(bet);

    const event: BetPlacedEvent = {
      betId: bet.id,
      playerId: bet.playerId,
      amount: Number(amountBet.valueInCents),
    };

    this.walletsClient.emit(BET_EVENTS.PLACED, event);

    this.eventEmitter.emit("bet.placed", {
      roundId: round.id,
      playerUsername: bet.playerUsername,
      amountBet: Number(amountBet.valueInCents),
    });

    return bet;
  }
}
