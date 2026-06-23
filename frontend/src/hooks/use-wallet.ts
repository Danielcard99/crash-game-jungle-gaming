import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Wallet } from "@/types/game";
import { useAuthStore } from "@/stores/auth.store";

export function useWallet() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.get<Wallet>("/wallets/me"),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchInterval: 3_000,
  });
}
