import { BetStatus } from "../../domain/bet/bet-status.enum";

export interface BetHistoryResponseDto {
  id: string;
  roundId: string;
  status: BetStatus;
  amountBet: number;
  payout: number | null;
  cashoutMultiplier: number | null;
}
