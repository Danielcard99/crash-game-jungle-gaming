import { BetStatus } from "../../domain/bet/bet-status.enum";

export interface BetResponseDto {
  id: string;
  roundId: string;
  status: BetStatus;
  amountBet: number;
}
