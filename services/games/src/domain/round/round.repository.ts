import { Round } from "./round.aggregate";

export interface RoundRepository {
  save(round: Round): Promise<void>;
  findById(id: string): Promise<Round | null>;
}
