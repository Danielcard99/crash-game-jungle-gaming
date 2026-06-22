import { create } from "zustand";
import type { Round, RoundPhase, Cents, Multiplier } from "@/types/game";

export interface LiveBet {
  userId: string;
  username: string;
  amount: Cents;
  cashoutMultiplier: Multiplier | null;
  payout: Cents | null;
  status: "pending" | "won" | "lost";
}

const PHASE_MAP: Record<string, RoundPhase> = {
  BETTING: "betting",
  RUNNING: "in_progress",
  CRASHED: "crashed",
  SETTLED: "idle",
};

interface SeedHistory {
  roundId?: string;
  serverSeed: string;
  serverSeedHash: string;
  crashPoint: Multiplier;
  clientSeed?: string;
  nonce?: number;
  hmac?: string;
}

interface GameStore {
  phase: RoundPhase;
  roundId: string | null;
  roundNumber: number | null;
  serverSeedHash: string | null;
  multiplier: number;
  bettingEndsAt: number | null;
  crashPoint: Multiplier | null;
  crashSeeds: { serverSeed: string; serverSeedHash: string } | null;
  liveBets: LiveBet[];
  myActiveBet: { amount: Cents; autoCashout: Multiplier | null } | null;
  socketConnected: boolean;
  seedHistory: SeedHistory[];
  autoCashoutEnabled: boolean;

  initFromRound: (round: Round) => void;
  setBetting: (roundId: string, bettingEndsAt: string, serverSeedHash: string) => void;
  setStarted: (roundId: string) => void;
  setMultiplier: (multiplier: Multiplier) => void;
  setCrashed: (crashPoint: Multiplier, serverSeed: string, serverSeedHash: string) => void;
  addBet: (bet: LiveBet) => void;
  applyBetCashout: (username: string, cashoutMultiplier: Multiplier, payout: Cents) => void;
  setMyActiveBet: (amount: Cents, autoCashout: Multiplier | null) => void;
  clearMyActiveBet: () => void;
  setSocketConnected: (connected: boolean) => void;
  setAutoCashoutEnabled: (enabled: boolean) => void;
}

export const useGameStore = create<GameStore>()((set) => ({
  phase: "idle",
  roundId: null,
  roundNumber: null,
  serverSeedHash: null,
  multiplier: 1,
  bettingEndsAt: null,
  crashPoint: null,
  crashSeeds: null,
  liveBets: [],
  myActiveBet: null,
  socketConnected: true,
  seedHistory: [],
  autoCashoutEnabled: false,

  initFromRound: (round) =>
    set({
      phase: PHASE_MAP[round.status] ?? "idle",
      roundId: round.id,
      roundNumber: null,
      serverSeedHash: round.serverSeedHash,
      bettingEndsAt: round.bettingEndsAt ? new Date(round.bettingEndsAt).getTime() : null,
      crashPoint: null,
      crashSeeds: null,
      multiplier: 1,
      liveBets: [],
    }),

  setBetting: (roundId, bettingEndsAt, serverSeedHash) =>
    set({
      phase: "betting",
      roundId,
      roundNumber: null,
      serverSeedHash,
      bettingEndsAt: new Date(bettingEndsAt).getTime(),
      crashPoint: null,
      crashSeeds: null,
      multiplier: 1,
      liveBets: [],
    }),

  setStarted: (roundId) =>
    set({
      phase: "in_progress",
      roundId,
      bettingEndsAt: null,
      multiplier: 1,
    }),

  setMultiplier: (multiplier) => set({ multiplier }),

  setCrashed: (crashPoint, serverSeed, serverSeedHash) =>
    set((state) => ({
      phase: "crashed",
      crashPoint,
      crashSeeds: { serverSeed, serverSeedHash },
      seedHistory: [
        { serverSeed, serverSeedHash, crashPoint },
        ...state.seedHistory,
      ].slice(0, 20),
      liveBets: state.liveBets.map((b) =>
        b.status === "pending" ? { ...b, status: "lost" as const } : b,
      ),
    })),

  addBet: (bet) => set((state) => ({ liveBets: [...state.liveBets, bet] })),

  applyBetCashout: (username, cashoutMultiplier, payout) =>
    set((state) => ({
      liveBets: state.liveBets.map((b) =>
        b.username === username ? { ...b, cashoutMultiplier, payout, status: "won" as const } : b,
      ),
    })),

  setMyActiveBet: (amount, autoCashout) => set({ myActiveBet: { amount, autoCashout } }),

  clearMyActiveBet: () => set({ myActiveBet: null }),

  setSocketConnected: (connected) => set({ socketConnected: connected }),

  setAutoCashoutEnabled: (enabled) => set({ autoCashoutEnabled: enabled }),
}));
