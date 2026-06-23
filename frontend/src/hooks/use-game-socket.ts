import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/stores/game.store";
import { useAuthStore } from "@/stores/auth.store";
import { formatCurrency, formatMultiplier } from "@/lib/format";
import { useSound } from "@/hooks/use-sound";
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
  const queryClient = useQueryClient();
  const { playCrash, playRoundStart } = useSound();

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => useGameStore.getState().setSocketConnected(true);
    const onDisconnect = () => useGameStore.getState().setSocketConnected(false);
    const onReconnectFailed = () => {
      toast.error("Conexão perdida", {
        description: "Não foi possível reconectar ao servidor. Recarregue a página.",
        duration: Infinity,
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_failed", onReconnectFailed);

    socket.on(EV.ROUND_BETTING, (data: WsRoundBetting) => {
      const s = useGameStore.getState();
      s.setBetting(data.roundId, data.bettingEndsAt, data.serverSeedHash);
      s.clearMyActiveBet();
    });

    socket.on(EV.ROUND_STARTED, (data: WsRoundStarted) => {
      useGameStore.getState().setStarted(data.roundId);
      playRoundStart();
    });

    socket.on(EV.ROUND_TICK, (data: WsRoundTick) => {
      useGameStore.getState().setMultiplier(data.currentMultiplier);
    });

    socket.on(EV.ROUND_CRASHED, (data: WsRoundCrashed) => {
      const store = useGameStore.getState();
      const hadActiveBet = store.myActiveBet !== null;
      store.setCrashed(data.crashPoint, data.serverSeed, data.serverSeedHash, data.clientSeed, data.nonce);
      playCrash();
      if (hadActiveBet) {
        store.clearMyActiveBet();
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
      }
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
      const store = useGameStore.getState();
      store.applyBetCashout(data.playerUsername, data.cashoutMultiplier, data.payout);

      const currentUser = useAuthStore.getState().user;
      const isMyBet = currentUser?.preferred_username === data.playerUsername;
      // myActiveBet still set means auto cashout — manual cashout clears it in onSuccess before this event arrives
      if (isMyBet && store.myActiveBet !== null) {
        store.clearMyActiveBet();
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        toast.success("Saque automático realizado!", {
          description: `Você sacou em ${formatMultiplier(data.cashoutMultiplier)} · ${formatCurrency(data.payout)}`,
        });
      }
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_failed", onReconnectFailed);
      Object.values(EV).forEach((ev) => socket.off(ev));
    };
  }, [queryClient, playCrash, playRoundStart]);
}
