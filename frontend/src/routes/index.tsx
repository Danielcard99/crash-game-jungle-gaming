import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useGameStore } from "@/stores/game.store";
import { useAuthStore } from "@/stores/auth.store";
import { useCurrentRound } from "@/hooks/use-current-round";
import { useRoundHistory } from "@/hooks/use-round-history";
import { useWallet } from "@/hooks/use-wallet";
import { usePlaceBet } from "@/hooks/use-place-bet";
import { useCashout } from "@/hooks/use-cashout";
import { useGameSocket } from "@/hooks/use-game-socket";
import { formatCurrency, formatMultiplier } from "@/lib/format";
import { auth } from "@/lib/auth";

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

function useCountdown(endsAt: number | null): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [endsAt]);
  return remaining;
}

const BETTING_WINDOW_MS = 10_000;

function Index() {
  useGameSocket();
  useCurrentRound();

  const game = useGameStore();
  const authState = useAuthStore();
  const { data: wallet } = useWallet();
  const { data: historyData } = useRoundHistory(20);
  const placeBet = usePlaceBet();
  const cashout = useCashout();

  const [betInput, setBetInput] = useState(100);
  const [autoCashoutInput, setAutoCashoutInput] = useState("2.00");

  const countdown = useCountdown(game.bettingEndsAt);
  const countdownSecs = Math.ceil(countdown / 1000);
  const countdownPct = Math.min(100, (countdown / BETTING_WINDOW_MS) * 100);

  const balanceCents = wallet?.balance ?? 0;
  const amountCents = Math.round(betInput * 100);

  // Potential payout in R$ (float for display)
  const potentialPayoutR = game.myActiveBet
    ? (game.myActiveBet.amount / 100) * game.multiplier
    : betInput * game.multiplier;

  const canBet =
    game.phase === "betting" && !game.myActiveBet && authState.isAuthenticated;
  const canCashout =
    game.phase === "in_progress" && !!game.myActiveBet;
  const isCrashed = game.phase === "crashed";

  const roundLabel = game.roundNumber
    ? `#${game.roundNumber.toLocaleString("pt-BR")}`
    : "—";
  const seedHashLabel = game.serverSeedHash
    ? `${game.serverSeedHash.slice(0, 4)}…${game.serverSeedHash.slice(-4)}`
    : "—";

  const history = historyData ?? [];

  function handleBet() {
    if (betInput < 1) {
      toast.error("Aposta inválida", { description: "Valor mínimo é R$ 1,00." });
      return;
    }
    if (betInput > 1000) {
      toast.error("Aposta inválida", {
        description: "Valor máximo é R$ 1.000,00.",
      });
      return;
    }
    if (amountCents > balanceCents) {
      toast.error("Saldo insuficiente", {
        description: "Faça um depósito para continuar apostando.",
      });
      return;
    }
    const autoCashout = parseFloat(autoCashoutInput);
    placeBet.mutate(
      {
        amount: amountCents,
        autoCashout: autoCashout > 1 ? autoCashout : undefined,
      },
      {
        onSuccess: () =>
          toast.success("Aposta confirmada!", {
            description: `${formatCurrency(amountCents)} na rodada ${roundLabel}`,
          }),
        onError: (err) =>
          toast.error("Erro ao apostar", { description: err.message }),
      },
    );
  }

  function handleCashout() {
    cashout.mutate(undefined, {
      onSuccess: (data) =>
        toast.success("Cash out realizado!", {
          description: `Você sacou em ${formatMultiplier(data.cashoutMultiplier ?? game.multiplier)} · ${formatCurrency(data.payout ?? 0)}`,
        }),
      onError: (err) =>
        toast.error("Erro ao sacar", { description: err.message }),
    });
  }

  function handleLogout() {
    authState.clear();
    auth.logout().catch(() => {});
  }

  return (
    <div className="min-h-screen bg-cosmic text-foreground">
      {/* Nav */}
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
                  onClick={handleLogout}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
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
              onClick={() =>
                toast.success("Depósito iniciado", {
                  description: "Você será redirecionado ao gateway.",
                })
              }
              className="rounded-lg bg-[image:var(--gradient-rocket)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
            >
              Depositar
            </button>
          </div>
        </div>
      </header>

      {/* Ticker */}
      <div className="overflow-hidden border-b border-border/60 bg-card/40">
        {history.length > 0 ? (
          <div className="flex w-max animate-ticker gap-6 py-2.5 text-xs font-mono">
            {[...history, ...history, ...history].map((h, i) => (
              <span
                key={`${h.id}-${i}`}
                className={`whitespace-nowrap ${h.crashPoint < 2 ? "text-danger" : "text-success"}`}
              >
                {h.crashPoint.toFixed(2)}x
              </span>
            ))}
          </div>
        ) : (
          <div className="py-2.5 px-6 text-xs text-muted-foreground font-mono">
            Carregando histórico…
          </div>
        )}
      </div>

      {/* Main */}
      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_340px]">
        {/* Game area */}
        <section className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-glow">
            {/* Status bar */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/40 px-5 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span
                  className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    game.phase === "in_progress"
                      ? "bg-success/10 text-success"
                      : game.phase === "betting"
                        ? "bg-primary/10 text-primary"
                        : game.phase === "crashed"
                          ? "bg-danger/10 text-danger"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      game.phase === "in_progress"
                        ? "animate-pulse-glow bg-success"
                        : game.phase === "betting"
                          ? "bg-primary animate-pulse-glow"
                          : game.phase === "crashed"
                            ? "bg-danger"
                            : "bg-muted-foreground"
                    }`}
                  />
                  {game.phase === "in_progress"
                    ? "EM ANDAMENTO"
                    : game.phase === "betting"
                      ? "APOSTAS ABERTAS"
                      : game.phase === "crashed"
                        ? "CRASHOU"
                        : "AGUARDANDO"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Seed hash:</span>
                <code className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-primary">
                  {seedHashLabel}
                </code>
                <button
                  onClick={() => {
                    if (game.serverSeedHash) {
                      navigator.clipboard
                        .writeText(game.serverSeedHash)
                        .then(() => toast.success("Hash copiado!"))
                        .catch(() => {});
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ⎘
                </button>
              </div>
            </div>

            {/* Grid background */}
            <div
              className="absolute inset-0 animate-grid opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(oklch(0.82 0.19 85 / 0.15) 1px, transparent 1px), linear-gradient(90deg, oklch(0.82 0.19 85 / 0.15) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            {/* Rocket trail */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 600 360"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="trail" x1="0" x2="1" y1="1" y2="0">
                  <stop
                    offset="0%"
                    stopColor="oklch(0.7 0.25 340)"
                    stopOpacity="0"
                  />
                  <stop
                    offset="100%"
                    stopColor={
                      isCrashed ? "oklch(0.65 0.25 25)" : "oklch(0.82 0.19 85)"
                    }
                    stopOpacity={isCrashed ? "0.5" : "0.9"}
                  />
                </linearGradient>
              </defs>
              <path
                d="M 0 360 Q 300 360 580 40"
                stroke="url(#trail)"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M 0 360 Q 300 360 580 40 L 580 360 Z"
                fill="url(#trail)"
                opacity="0.15"
              />
            </svg>

            <div className="relative flex h-[440px] flex-col items-center justify-center px-6">
              <span className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {isCrashed ? "Crashou em" : "Multiplicador atual"}
              </span>
              <div
                className={`font-mono text-7xl font-bold sm:text-9xl ${
                  isCrashed ? "text-danger" : "text-gradient-multiplier"
                }`}
              >
                {isCrashed && game.crashPoint !== null
                  ? `${game.crashPoint.toFixed(2)}x`
                  : `${game.multiplier.toFixed(2)}x`}
              </div>

              {!isCrashed && (
                <div className="mt-5 rounded-full border border-success/40 bg-success/10 px-4 py-1.5 text-sm">
                  <span className="text-muted-foreground">
                    {game.myActiveBet ? "Você ganharia " : "Payout potencial "}
                  </span>
                  <span className="font-mono font-bold text-success">
                    {formatCurrency(Math.round(potentialPayoutR * 100))}
                  </span>
                </div>
              )}

              {isCrashed && game.crashSeeds && (
                <div className="mt-4 flex flex-col items-center gap-1 text-center">
                  <p className="text-xs text-muted-foreground">
                    Server seed revelada:
                  </p>
                  <code className="max-w-xs break-all rounded bg-muted px-2 py-1 font-mono text-[11px] text-primary">
                    {game.crashSeeds.serverSeed}
                  </code>
                </div>
              )}

              {!isCrashed && (
                <div
                  className={`absolute right-8 top-20 text-5xl ${
                    game.phase === "in_progress" ? "animate-float" : ""
                  }`}
                >
                  🚀
                </div>
              )}
              {isCrashed && (
                <div className="absolute right-8 top-20 animate-pulse-glow text-5xl">
                  💥
                </div>
              )}

              {isCrashed && game.crashPoint !== null && (
                <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-lg border border-danger/50 bg-danger/15 px-3 py-1.5 text-xs font-bold text-danger">
                  <span className="text-lg">💥</span>
                  CRASHED @ {game.crashPoint.toFixed(2)}x
                </div>
              )}
            </div>

            {/* Countdown bar — only during betting phase */}
            {game.phase === "betting" && (
              <div className="relative z-10 border-t border-border/60 bg-background/40 px-5 py-3 backdrop-blur-sm">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Próxima rodada em
                  </span>
                  <span className="font-mono font-semibold text-primary">
                    00:{countdownSecs.toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-[image:var(--gradient-rocket)] transition-all duration-100"
                    style={{ width: `${countdownPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* History chips */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Últimas {history.length || "…"} rodadas
              </h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-danger" /> &lt; 2x
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" /> ≥ 2x
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-accent" /> ≥ 10x
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((h, i) => (
                <span
                  key={`${h.id}-${i}`}
                  className={`rounded-md border px-3 py-1.5 font-mono text-sm ${
                    h.crashPoint < 2
                      ? "border-danger/40 bg-danger/10 text-danger"
                      : h.crashPoint >= 10
                        ? "border-accent/40 bg-accent/10 text-accent shadow-accent-glow"
                        : "border-success/40 bg-success/10 text-success"
                  }`}
                >
                  {h.crashPoint.toFixed(2)}x
                </span>
              ))}
              {history.length === 0 && (
                <div className="flex gap-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-8 w-14 animate-pulse-glow rounded-md bg-muted"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live bets table */}
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Apostas da rodada
              </h3>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-success" />
                {game.liveBets.length} jogadores ·{" "}
                {formatCurrency(
                  game.liveBets.reduce((s, b) => s + b.amount, 0),
                )}
              </span>
            </div>
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-3 border-b border-border bg-background/40 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Jogador</span>
              <span>Aposta</span>
              <span>Cashout</span>
              <span>Status</span>
              <span className="text-right">Ganho</span>
            </div>
            <div className="divide-y divide-border">
              {game.liveBets.map((b) => (
                <div
                  key={b.userId}
                  className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center gap-3 px-5 py-3 text-sm ${
                    b.status === "won" ? "bg-success/5" : b.status === "lost" ? "bg-danger/5" : ""
                  } ${b.userId === authState.user?.sub ? "ring-1 ring-inset ring-primary/30" : ""}`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase">
                      {b.username[0]}
                    </span>
                    @{b.username}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {formatCurrency(b.amount)}
                  </span>
                  <span
                    className={`font-mono ${b.cashoutMultiplier === null ? "text-muted-foreground" : "text-primary"}`}
                  >
                    {b.cashoutMultiplier !== null
                      ? `${b.cashoutMultiplier.toFixed(2)}x`
                      : "—"}
                  </span>
                  <span>
                    {b.status === "pending" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                        Jogando
                      </span>
                    )}
                    {b.status === "won" && (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-success">
                        Sacou ✓
                      </span>
                    )}
                    {b.status === "lost" && (
                      <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-danger">
                        Perdeu
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-right font-mono font-semibold ${
                      b.payout && b.payout > 0
                        ? "text-success"
                        : "text-muted-foreground"
                    }`}
                  >
                    {b.payout && b.payout > 0
                      ? `+${formatCurrency(b.payout)}`
                      : "—"}
                  </span>
                </div>
              ))}
              {game.liveBets.length === 0 && (
                <div className="px-5 py-6 text-center text-xs text-muted-foreground">
                  {game.phase === "betting"
                    ? "Aguardando apostas…"
                    : "Sem apostas nesta rodada."}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bet panel */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            {!authState.isAuthenticated ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Faça login para apostar
                </p>
                <Link
                  to="/login"
                  className="w-full rounded-xl bg-[image:var(--gradient-rocket)] py-3 text-center font-display font-bold text-primary-foreground shadow-glow transition hover:opacity-95"
                >
                  Entrar para apostar
                </Link>
              </div>
            ) : (
              <>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Valor da aposta
                </label>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <span className="text-muted-foreground">R$</span>
                  <input
                    type="number"
                    value={betInput}
                    onChange={(e) => setBetInput(Number(e.target.value))}
                    disabled={!canBet}
                    className="w-full bg-transparent font-mono text-lg outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={() =>
                      setBetInput((b) => Math.max(1, Math.round(b / 2)))
                    }
                    disabled={!canBet}
                    className="rounded border border-border px-2 py-0.5 text-xs disabled:opacity-40"
                  >
                    ½
                  </button>
                  <button
                    onClick={() => setBetInput((b) => Math.min(1000, b * 2))}
                    disabled={!canBet}
                    className="rounded border border-border px-2 py-0.5 text-xs disabled:opacity-40"
                  >
                    2×
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Mín. R$ 1,00 · Máx. R$ 1.000,00
                </p>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[50, 100, 500, 1000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setBetInput(v)}
                      disabled={!canBet}
                      className="rounded-md border border-border bg-background py-1.5 font-mono text-sm transition hover:border-primary disabled:opacity-40"
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Saque automático em
                  </label>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                    <input
                      value={autoCashoutInput}
                      onChange={(e) => setAutoCashoutInput(e.target.value)}
                      disabled={!!game.myActiveBet}
                      className="w-full bg-transparent font-mono text-lg outline-none disabled:opacity-50"
                    />
                    <span className="font-mono text-muted-foreground">x</span>
                  </div>
                </div>

                {/* Apostar — visible during betting phase */}
                {game.phase !== "in_progress" && (
                  <button
                    onClick={handleBet}
                    disabled={!canBet || placeBet.isPending}
                    className="mt-5 w-full rounded-xl bg-[image:var(--gradient-rocket)] py-4 font-display text-lg font-bold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {placeBet.isPending
                      ? "Aguardando…"
                      : game.myActiveBet
                        ? `Apostado ${formatCurrency(game.myActiveBet.amount)}`
                        : `Apostar R$ ${betInput}`}
                  </button>
                )}

                {/* SACAR — visible during active round */}
                {(game.phase === "in_progress" || game.phase === "crashed") && (
                  <button
                    onClick={handleCashout}
                    disabled={!canCashout || cashout.isPending}
                    className="mt-2 flex w-full items-center justify-between rounded-xl border-2 border-success bg-success/15 px-5 py-4 font-display font-bold text-success shadow-accent-glow transition hover:bg-success/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-lg">
                      {cashout.isPending ? "SACANDO…" : "SACAR"}
                    </span>
                    <span className="font-mono text-xl">
                      {formatCurrency(Math.round(potentialPayoutR * 100))}
                    </span>
                  </button>
                )}

                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Ganho potencial:{" "}
                  <span className="font-mono text-primary">
                    {formatCurrency(Math.round(potentialPayoutR * 100))}
                  </span>
                </p>
              </>
            )}
          </div>

          {/* Provably fair */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Provably Fair
              </h4>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-success">
                Verificado
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-muted-foreground">
                  {isCrashed && game.crashSeeds
                    ? "Server seed revelada"
                    : "Server seed hash (rodada atual)"}
                </p>
                <code className="mt-1 block break-all rounded bg-muted px-2 py-1.5 font-mono text-[11px] text-primary">
                  {isCrashed && game.crashSeeds
                    ? game.crashSeeds.serverSeed
                    : (game.serverSeedHash ?? "—")}
                </code>
              </div>
              {game.roundId && isCrashed && (
                <a
                  href={`${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/games/rounds/${game.roundId}/verify`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-primary hover:underline"
                >
                  Verificar rodada →
                </a>
              )}
            </div>
          </div>

          {/* Curve formula */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Fórmula da curva
            </h4>
            <code className="block break-all rounded bg-muted px-3 py-2 font-mono text-[11px] text-primary">
              m(t) = 1.00 · e^(0.06 · t)
            </code>
            <p className="mt-2 text-[11px] text-muted-foreground">
              House edge: 1% · RTP: 99%
            </p>
          </div>

          {/* How to play */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Como jogar
            </h4>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="mr-2 font-mono text-primary">01.</span>Faça
                sua aposta antes da rodada.
              </li>
              <li>
                <span className="mr-2 font-mono text-primary">02.</span>O
                foguete decola e o multiplicador sobe.
              </li>
              <li>
                <span className="mr-2 font-mono text-primary">03.</span>Saque
                antes do crash para ganhar.
              </li>
            </ol>
          </div>
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
