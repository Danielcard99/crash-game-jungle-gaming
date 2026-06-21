import { Inject, Injectable } from "@nestjs/common";
import {
  BET_REPOSITORY,
  type BetRepository,
} from "../../domain/bet/bet.repository";
import { ClientProxy } from "@nestjs/microservices";
import { Bet } from "../../domain/bet/bet.aggregate";
import { BET_EVENTS, type BetWonEvent } from "@crash/rabbitmq-kit";

@Injectable()
export class CashOutUseCase {
  constructor(
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
    @Inject("WALLETS_CLIENT") private readonly walletsClient: ClientProxy,
  ) {}

  async execute(params: {
    betId: string;
    currentMultiplier: number;
  }): Promise<Bet> {
    const bet = await this.betRepository.findById(params.betId);

    if (!bet) {
      throw new Error("Bet not found");
    }

    bet.cashOut(params.currentMultiplier);

    await this.betRepository.save(bet);

    const event: BetWonEvent = {
      betId: bet.id,
      playerId: bet.playerId,
      payout: Number(bet.payout!.valueInCents),
    };

    this.walletsClient.emit(BET_EVENTS.WON, event);

    return bet;
  }
}
