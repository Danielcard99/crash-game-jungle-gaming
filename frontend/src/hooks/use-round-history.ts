import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface RoundHistoryEntry {
  id: string;
  crashPoint: number;
  settledAt: string;
}

export function useRoundHistory(limit = 20) {
  return useQuery({
    queryKey: ["rounds", "history", limit],
    queryFn: () =>
      api.get<RoundHistoryEntry[]>(`/games/rounds/history?limit=${limit}`),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
