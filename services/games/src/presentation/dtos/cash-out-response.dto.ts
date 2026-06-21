import { BetResponseDto } from "./bet-response.dto";

export interface CashOutResponseDto extends BetResponseDto {
  payout: number;
  cashoutMultiplier: number;
}
