import { Bet } from "./bet.aggregate";

export interface BetRepository {
  save(bet: Bet): Promise<void>;
  findById(id: string): Promise<Bet | null>;
}
