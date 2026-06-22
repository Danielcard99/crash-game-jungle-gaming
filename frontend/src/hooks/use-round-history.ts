import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RoundHistoryEntry } from "@/types/game";

export type { RoundHistoryEntry };

export function useRoundHistory(limit = 20) {
  return useQuery({
    queryKey: ["rounds", "history", limit],
    queryFn: () => api.get<RoundHistoryEntry[]>(`/games/rounds/history?limit=${limit}`),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
