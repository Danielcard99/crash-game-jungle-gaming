import { Injectable, Inject } from "@nestjs/common";
import {
  BET_REPOSITORY,
  type BetRepository,
} from "../../domain/bet/bet.repository";
import { Bet } from "../../domain/bet/bet.aggregate";

@Injectable()
export class GetMyBetsUseCase {
  constructor(
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
  ) {}

  async execute(playerId: string): Promise<Bet[]> {
    return this.betRepository.findAllByPlayerId(playerId);
  }
}
