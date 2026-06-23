import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Bet, Cents, Multiplier } from "@/types/game";
import { useGameStore } from "@/stores/game.store";
import { useSound } from "@/hooks/use-sound";

interface PlaceBetPayload {
  amount: Cents;
  autoCashout?: Multiplier;
}

export function usePlaceBet() {
  const queryClient = useQueryClient();
  const setMyActiveBet = useGameStore((s) => s.setMyActiveBet);
  const { playBet } = useSound();

  return useMutation({
    mutationFn: (payload: PlaceBetPayload) =>
      api.post<Bet>("/games/bet", {
        amountInCents: payload.amount,
        autoCashoutMultiplier: payload.autoCashout ?? null,
      }),
    onSuccess: (_, variables) => {
      playBet();
      setMyActiveBet(variables.amount, variables.autoCashout ?? null);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
