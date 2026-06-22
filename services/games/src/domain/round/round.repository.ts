import { Round } from "./round.aggregate";

export const ROUND_REPOSITORY = Symbol("RoundRepository");

export interface RoundRepository {
  save(round: Round): Promise<void>;
  findById(id: string): Promise<Round | null>;
  findCurrentBettingRound(): Promise<Round | null>;
  findLatestUnsettledRound(): Promise<Round | null>;
  findSettledRounds(limit: number): Promise<Round[]>;
}
