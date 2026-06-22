export type Cents = number;
export type Multiplier = number;
export type RoundPhase = "idle" | "betting" | "in_progress" | "crashed";

export interface Round {
  id: string;
  status: "BETTING" | "RUNNING" | "CRASHED" | "SETTLED";
  serverSeedHash: string;
  bettingEndsAt: string | null;
  startedAt: string | null;
  crashedAt: string | null;
}

export interface Bet {
  id: string;
  roundId: string;
  status: "PENDING" | "ACTIVE" | "CASHED_OUT" | "LOST" | "REJECTED";
  amountBet: Cents;
  cashoutMultiplier: Multiplier | null;
  payout: Cents | null;
}

export interface RoundHistoryEntry {
  id: string;
  roundNumber: number;
  crashPoint: Multiplier;
  serverSeedHash: string;
  completedAt: string;
}

export interface Wallet {
  id: string;
  playerId: string;
  balance: Cents;
}

export interface MyBet extends Bet {
  round: {
    roundNumber: number;
    crashPoint: Multiplier | null;
    completedAt: string | null;
  };
}

// WebSocket event payloads
export interface WsRoundBetting {
  roundId: string;
  bettingEndsAt: string;
  serverSeedHash: string;
}

export interface WsRoundStarted {
  roundId: string;
}

export interface WsRoundTick {
  roundId: string;
  currentMultiplier: Multiplier;
}

export interface WsRoundCrashed {
  roundId: string;
  crashPoint: Multiplier;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
}

export interface WsBetPlaced {
  roundId: string;
  playerUsername: string;
  amountBet: Cents;
}

export interface WsBetCashedOut {
  roundId: string;
  playerUsername: string;
  payout: Cents;
  cashoutMultiplier: Multiplier;
}
