import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Bet, Cents, Multiplier } from "@/types/game";
import { useGameStore } from "@/stores/game.store";

interface PlaceBetPayload {
  amount: Cents;
  autoCashout?: Multiplier;
}

export function usePlaceBet() {
  const queryClient = useQueryClient();
  const setMyActiveBet = useGameStore((s) => s.setMyActiveBet);

  return useMutation({
    mutationFn: (payload: PlaceBetPayload) =>
      api.post<Bet>("/games/bet", {
        amountInCents: payload.amount,
        autoCashoutMultiplier: payload.autoCashout ?? null,
      }),
    onSuccess: (_, variables) => {
      setMyActiveBet(variables.amount, variables.autoCashout ?? null);
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
