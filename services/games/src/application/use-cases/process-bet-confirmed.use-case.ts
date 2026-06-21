import { Inject, Injectable } from "@nestjs/common";
import {
  BET_REPOSITORY,
  type BetRepository,
} from "../../domain/bet/bet.repository";
import { type BetConfirmedEvent } from "@crash/rabbitmq-kit";

@Injectable()
export class ProcessBetConfirmedUseCase {
  constructor(
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
  ) {}

  async execute(data: BetConfirmedEvent): Promise<void> {
    const bet = await this.betRepository.findById(data.betId);
    if (!bet) return;

    bet.confirm();
    await this.betRepository.save(bet);
  }
}
