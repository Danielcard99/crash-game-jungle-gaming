import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Volume2, VolumeX } from "lucide-react";
import { useGameStore } from "@/stores/game.store";
import { useAuthStore } from "@/stores/auth.store";
import { useCurrentRound } from "@/hooks/use-current-round";
import { useRoundHistory } from "@/hooks/use-round-history";
import { useWallet } from "@/hooks/use-wallet";
import { useGameSocket } from "@/hooks/use-game-socket";
import { formatCurrency } from "@/lib/format";
import { auth } from "@/lib/auth";
import { MultiplierDisplay } from "@/components/game/multiplier-display";
import { RoundTicker } from "@/components/game/round-ticker";
import { RoundHistoryChips } from "@/components/game/round-history-chips";
import { LiveBetsTable } from "@/components/game/live-bets-table";
import { BetPanel } from "@/components/game/bet-panel";
import { ProvablyFairCard } from "@/components/game/provably-fair-card";
import { FormulaCard } from "@/components/game/formula-card";
import { HowToPlayCard } from "@/components/game/how-to-play-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rocket Crash — Aposte. Suba. Saque." },
      {
        name: "description",
        content:
          "Crash game em tempo real. Aposte, veja o foguete subir e saque antes que ele exploda.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  useGameSocket();
  const { isError: roundError } = useCurrentRound();

  const socketConnected = useGameStore((s) => s.socketConnected);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const authState = useAuthStore();
  const { data: wallet } = useWallet();
  const { data: historyData, isError: historyError } = useRoundHistory(20);
  const history = historyData ?? [];

  function handleLogout() {
    authState.clear();
    auth.logout().catch(() => {});
  }

  return (
    <div className="min-h-screen bg-cosmic text-foreground">
      <header className="border-b border-border/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-rocket)] shadow-glow">
              <span className="text-lg">🚀</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              ROCKET<span className="text-gradient-multiplier">CRASH</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {authState.isAuthenticated && authState.user ? (
              <>
                <div className="hidden items-center gap-3 rounded-lg border border-border bg-card px-3 py-1.5 sm:flex">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[image:var(--gradient-rocket)] text-xs font-bold text-primary-foreground">
                    {authState.user.preferred_username[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs text-muted-foreground">
                      @{authState.user.preferred_username}
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {wallet ? formatCurrency(wallet.balance) : "…"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleSound}
                  title={soundEnabled ? "Mute" : "Unmute"}
                  className="cursor-pointer rounded-lg border border-border bg-card p-2 text-muted-foreground transition hover:text-foreground"
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Entrar
              </Link>
            )}
            <button
              type="button"
              onClick={() =>
                toast.success("Depósito iniciado", {
                  description: "Você será redirecionado ao gateway.",
                })
              }
              className="cursor-pointer rounded-lg bg-[image:var(--gradient-rocket)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
            >
              Depositar
            </button>
          </div>
        </div>
      </header>

      {!socketConnected && (
        <div
          role="alert"
          className="border-b border-danger/50 bg-danger/10 px-6 py-2.5 text-center text-xs font-semibold text-danger"
        >
          Conexão perdida — tentando reconectar ao servidor…
        </div>
      )}

      {roundError && (
        <div
          role="alert"
          className="border-b border-danger/50 bg-danger/10 px-6 py-2.5 text-center text-xs font-semibold text-danger"
        >
          Erro ao carregar a rodada atual. Recarregue a página se o problema persistir.
        </div>
      )}

      <RoundTicker history={history} />

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <MultiplierDisplay />
          {historyError ? (
            <p className="text-xs text-danger">Erro ao carregar histórico de rodadas.</p>
          ) : (
            <RoundHistoryChips history={history} />
          )}
          <LiveBetsTable />
        </section>

        <aside className="space-y-4">
          <BetPanel />
          <ProvablyFairCard />
          <FormulaCard />
          <HowToPlayCard />
        </aside>
      </main>

      <footer className="border-t border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© 2026 RocketCrash · Jogue com responsabilidade · 18+</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground">
              Termos
            </a>
            <a href="#" className="hover:text-foreground">
              Provably Fair
            </a>
            <a href="#" className="hover:text-foreground">
              Suporte 24/7
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
