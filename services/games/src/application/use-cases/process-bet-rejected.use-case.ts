import { Inject, Injectable } from "@nestjs/common";
import {
  BET_REPOSITORY,
  type BetRepository,
} from "../../domain/bet/bet.repository";
import { type BetRejectedEvent } from "@crash/rabbitmq-kit";

@Injectable()
export class ProcessBetRejectedUseCase {
  constructor(
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
  ) {}

  async execute(data: BetRejectedEvent): Promise<void> {
    const bet = await this.betRepository.findById(data.betId);
    if (!bet) return;

    bet.reject();
    await this.betRepository.save(bet);
  }
}
