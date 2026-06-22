import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Bet } from "@/types/game";
import { useGameStore } from "@/stores/game.store";

export function useCashout() {
  const queryClient = useQueryClient();
  const clearMyActiveBet = useGameStore((s) => s.clearMyActiveBet);

  return useMutation({
    mutationFn: () => api.post<Bet>("/games/bet/cashout"),
    onSuccess: () => {
      clearMyActiveBet();
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
