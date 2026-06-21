import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  BET_REPOSITORY,
  type BetRepository,
} from "../../domain/bet/bet.repository";
import { Bet } from "../../domain/bet/bet.aggregate";
import {
  BET_EVENTS,
  type EventPublisher,
  type BetWonEvent,
} from "@crash/rabbitmq-kit";
import type { LocalEventEmitter } from "../events/local-event-emitter";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class CashOutUseCase {
  constructor(
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
    @Inject("WALLETS_CLIENT") private readonly walletsClient: EventPublisher,
    @Inject(EventEmitter2) private readonly eventEmitter: LocalEventEmitter,
  ) {}

  async execute(params: {
    playerId: string;
    currentMultiplier: number;
  }): Promise<Bet> {
    const bet = await this.betRepository.findActiveBetByPlayerId(
      params.playerId,
    );

    if (!bet) {
      throw new NotFoundException("No active bet found for this player");
    }

    bet.cashOut(params.currentMultiplier);

    await this.betRepository.save(bet);

    const event: BetWonEvent = {
      betId: bet.id,
      playerId: bet.playerId,
      payout: Number(bet.payout!.valueInCents),
    };

    this.walletsClient.emit(BET_EVENTS.WON, event);

    this.eventEmitter.emit("bet.cashedOut", {
      roundId: bet.roundId,
      playerUsername: bet.playerUsername,
      payout: Number(bet.payout!.valueInCents),
      cashoutMultiplier: bet.cashoutMultiplier,
    });

    return bet;
  }
}
