import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/stores/game.store";
import type {
  WsRoundBetting,
  WsRoundStarted,
  WsRoundTick,
  WsRoundCrashed,
  WsBetPlaced,
  WsBetCashedOut,
} from "@/types/game";

const EV = {
  ROUND_BETTING: "round:created",
  ROUND_STARTED: "round:started",
  ROUND_TICK: "round:tick",
  ROUND_CRASHED: "round:crashed",
  BET_PLACED: "bet:placed",
  BET_CASHOUT: "bet:cashedOut",
} as const;

export function useGameSocket() {
  useEffect(() => {
    const socket = getSocket();

    socket.on(EV.ROUND_BETTING, (data: WsRoundBetting) => {
      const s = useGameStore.getState();
      s.setBetting(data.roundId, data.bettingEndsAt, data.serverSeedHash);
      s.clearMyActiveBet();
    });

    socket.on(EV.ROUND_STARTED, (data: WsRoundStarted) => {
      useGameStore.getState().setStarted(data.roundId);
    });

    socket.on(EV.ROUND_TICK, (data: WsRoundTick) => {
      useGameStore.getState().setMultiplier(data.currentMultiplier);
    });

    socket.on(EV.ROUND_CRASHED, (data: WsRoundCrashed) => {
      useGameStore
        .getState()
        .setCrashed(data.crashPoint, data.serverSeed, data.serverSeedHash);
    });

    socket.on(EV.BET_PLACED, (data: WsBetPlaced) => {
      useGameStore.getState().addBet({
        userId: data.playerUsername,
        username: data.playerUsername,
        amount: data.amountBet,
        cashoutMultiplier: null,
        payout: null,
        status: "pending",
      });
    });

    socket.on(EV.BET_CASHOUT, (data: WsBetCashedOut) => {
      useGameStore
        .getState()
        .applyBetCashout(data.playerUsername, data.cashoutMultiplier, data.payout);
    });

    return () => {
      Object.values(EV).forEach((ev) => socket.off(ev));
    };
  }, []);
}
