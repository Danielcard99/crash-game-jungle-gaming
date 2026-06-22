import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import type { Round } from "@/types/game";
import { useGameStore } from "@/stores/game.store";

export function useCurrentRound() {
  const initFromRound = useGameStore((s) => s.initFromRound);

  const query = useQuery({
    queryKey: ["rounds", "current"],
    queryFn: () => api.get<Round>("/games/rounds/current"),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      initFromRound(query.data);
    }
  }, [query.data, initFromRound]);

  return query;
}
