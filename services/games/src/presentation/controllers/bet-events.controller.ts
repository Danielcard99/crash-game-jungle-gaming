import { Controller } from "@nestjs/common";
import { ProcessBetConfirmedUseCase } from "../../application/use-cases/process-bet-confirmed.use-case";
import { ProcessBetRejectedUseCase } from "../../application/use-cases/process-bet-rejected.use-case";
import { EventPattern, Payload } from "@nestjs/microservices";
import {
  BET_EVENTS,
  type BetConfirmedEvent,
  type BetRejectedEvent,
} from "@crash/rabbitmq-kit";

@Controller()
export class BetEventsController {
  constructor(
    private readonly processBetConfirmed: ProcessBetConfirmedUseCase,
    private readonly processBetRejected: ProcessBetRejectedUseCase,
  ) {}

  @EventPattern(BET_EVENTS.CONFIRMED)
  async handleBetConfirmed(@Payload() data: BetConfirmedEvent) {
    await this.processBetConfirmed.execute(data);
  }

  @EventPattern(BET_EVENTS.REJECTED)
  async handleBetRejected(@Payload() data: BetRejectedEvent) {
    await this.processBetRejected.execute(data);
  }
}
