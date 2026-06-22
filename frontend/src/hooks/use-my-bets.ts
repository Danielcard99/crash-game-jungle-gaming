import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { MyBet } from "@/types/game";
import { useAuthStore } from "@/stores/auth.store";

interface MyBetsResponse {
  data: MyBet[];
  total: number;
  page: number;
  limit: number;
}

export function useMyBets(page = 1, limit = 20) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["bets", "me", page, limit],
    queryFn: () =>
      api.get<MyBetsResponse>(`/games/bets/me?page=${page}&limit=${limit}`),
    enabled: isAuthenticated,
  });
}
