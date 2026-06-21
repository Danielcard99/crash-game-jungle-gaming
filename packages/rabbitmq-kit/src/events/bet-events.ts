export const BET_EVENTS = {
  PLACED: "bet.placed",
  CONFIRMED: "bet.confirmed",
  REJECTED: "bet.rejected",
  WON: "bet.won",
} as const;

export enum BetRejectionReason {
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
}

export interface BetPlacedEvent {
  betId: string;
  playerId: string;
  amount: number; // centavos
}

export interface BetConfirmedEvent {
  betId: string;
}

export interface BetRejectedEvent {
  betId: string;
  reason: BetRejectionReason;
}

export interface BetWonEvent {
  betId: string;
  playerId: string;
  payout: number; // centavos
}
