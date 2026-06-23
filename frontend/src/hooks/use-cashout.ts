import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Bet } from "@/types/game";
import { useGameStore } from "@/stores/game.store";
import { useSound } from "@/hooks/use-sound";

export function useCashout() {
  const queryClient = useQueryClient();
  const clearMyActiveBet = useGameStore((s) => s.clearMyActiveBet);
  const multiplier = useGameStore((s) => s.multiplier);
  const { playCashout } = useSound();

  return useMutation({
    mutationFn: () => api.post<Bet>("/games/bet/cashout", { currentMultiplier: multiplier }),
    onMutate: () => {
      clearMyActiveBet();
    },
    onSuccess: () => {
      playCashout();
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
