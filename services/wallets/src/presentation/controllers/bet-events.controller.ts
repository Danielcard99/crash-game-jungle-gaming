import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import {
  BET_EVENTS,
  type BetPlacedEvent,
  type BetWonEvent,
} from "@crash/rabbitmq-kit";
import { ProcessBetWonUseCase } from "../../application/use-cases/process-bet-won.use-case";
import { ProcessBetPlacedUseCase } from "../../application/use-cases/process-bet-placed.use-case";

@Controller()
export class BetEventsController {
  constructor(
    private readonly processBetPlaced: ProcessBetPlacedUseCase,
    private readonly processBetWon: ProcessBetWonUseCase,
  ) {}

  @EventPattern(BET_EVENTS.PLACED)
  async handleBetPlaced(@Payload() data: BetPlacedEvent) {
    await this.processBetPlaced.execute(data);
  }

  @EventPattern(BET_EVENTS.WON)
  async handleBetWon(@Payload() data: BetWonEvent) {
    await this.processBetWon.execute(data);
  }
}
