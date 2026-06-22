import { Bet } from "./bet.aggregate";

export const BET_REPOSITORY = Symbol("BetRepository");

export interface BetRepository {
  save(bet: Bet): Promise<void>;
  findById(id: string): Promise<Bet | null>;
  findByRoundIdAndPlayerId(
    roundId: string,
    playerId: string,
  ): Promise<Bet | null>;
  findActiveBetByPlayerId(playerId: string): Promise<Bet | null>;
  findActiveBetsByRoundId(roundId: string): Promise<Bet[]>;
  findAllByPlayerId(playerId: string): Promise<Bet[]>;
}
