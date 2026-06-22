import { memo, useId } from "react";
import { toast } from "sonner";
import { useGameStore } from "@/stores/game.store";
import { useCountdown } from "@/hooks/use-countdown";
import { formatCurrency } from "@/lib/format";

const BETTING_WINDOW_MS = 10_000;

// Re-renders every WS tick (~100ms). Isolated so Index stays quiet during ticks.
export const MultiplierDisplay = memo(function MultiplierDisplay() {
  const gradientId = useId();
  const multiplier = useGameStore((s) => s.multiplier);
  const phase = useGameStore((s) => s.phase);
  const crashPoint = useGameStore((s) => s.crashPoint);
  const crashSeeds = useGameStore((s) => s.crashSeeds);
  const serverSeedHash = useGameStore((s) => s.serverSeedHash);
  const bettingEndsAt = useGameStore((s) => s.bettingEndsAt);
  const myActiveBet = useGameStore((s) => s.myActiveBet);

  const isCrashed = phase === "crashed";

  const countdown = useCountdown(bettingEndsAt);
  const countdownSecs = Math.ceil(countdown / 1000);
  const countdownPct = Math.min(100, (countdown / BETTING_WINDOW_MS) * 100);

  const seedHashLabel = serverSeedHash
    ? `${serverSeedHash.slice(0, 4)}…${serverSeedHash.slice(-4)}`
    : "—";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-glow">
      {/* Status bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/40 px-5 py-3 backdrop-blur-sm">
        <span
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            phase === "in_progress"
              ? "bg-success/10 text-success"
              : phase === "betting"
                ? "bg-primary/10 text-primary"
                : phase === "crashed"
                  ? "bg-danger/10 text-danger"
                  : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              phase === "in_progress"
                ? "animate-pulse-glow bg-success"
                : phase === "betting"
                  ? "bg-primary animate-pulse-glow"
                  : phase === "crashed"
                    ? "bg-danger"
                    : "bg-muted-foreground"
            }`}
          />
          {phase === "in_progress"
            ? "EM ANDAMENTO"
            : phase === "betting"
              ? "APOSTAS ABERTAS"
              : phase === "crashed"
                ? "CRASHOU"
                : "AGUARDANDO"}
        </span>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Seed hash:</span>
          <code className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-primary">
            {seedHashLabel}
          </code>
          <button
            type="button"
            aria-label="Copiar server seed hash"
            onClick={() => {
              if (serverSeedHash) {
                navigator.clipboard
                  .writeText(serverSeedHash)
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
          <linearGradient id={gradientId} x1="0" x2="1" y1="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.7 0.25 340)" stopOpacity="0" />
            <stop
              offset="100%"
              stopColor={isCrashed ? "oklch(0.65 0.25 25)" : "oklch(0.82 0.19 85)"}
              stopOpacity={isCrashed ? "0.5" : "0.9"}
            />
          </linearGradient>
        </defs>
        <path
          d="M 0 360 Q 300 360 580 40"
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M 0 360 Q 300 360 580 40 L 580 360 Z"
          fill={`url(#${gradientId})`}
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
          {isCrashed && crashPoint !== null
            ? `${crashPoint.toFixed(2)}x`
            : `${multiplier.toFixed(2)}x`}
        </div>

        {/* Payout display — only shown when player has an active bet */}
        {!isCrashed && myActiveBet && (
          <div className="mt-5 rounded-full border border-success/40 bg-success/10 px-4 py-1.5 text-sm">
            <span className="text-muted-foreground">Você ganharia </span>
            <span className="font-mono font-bold text-success">
              {formatCurrency(Math.round((myActiveBet.amount / 100) * multiplier * 100))}
            </span>
          </div>
        )}

        {isCrashed && crashSeeds && (
          <div className="mt-4 flex flex-col items-center gap-1 text-center">
            <p className="text-xs text-muted-foreground">Server seed revelada:</p>
            <code className="max-w-xs break-all rounded bg-muted px-2 py-1 font-mono text-[11px] text-primary">
              {crashSeeds.serverSeed}
            </code>
          </div>
        )}

        {!isCrashed && (
          <div
            className={`absolute right-8 top-20 text-5xl ${
              phase === "in_progress" ? "animate-float" : ""
            }`}
          >
            🚀
          </div>
        )}
        {isCrashed && <div className="absolute right-8 top-20 animate-pulse-glow text-5xl">💥</div>}

        {isCrashed && crashPoint !== null && (
          <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-lg border border-danger/50 bg-danger/15 px-3 py-1.5 text-xs font-bold text-danger">
            <span className="text-lg">💥</span>
            CRASHED @ {crashPoint.toFixed(2)}x
          </div>
        )}
      </div>

      {/* Countdown bar — only during betting phase */}
      {phase === "betting" && (
        <div className="relative z-10 border-t border-border/60 bg-background/40 px-5 py-3 backdrop-blur-sm">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Próxima rodada em</span>
            <span className="font-mono font-semibold text-primary">
              00:{countdownSecs.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-[image:var(--gradient-rocket)]"
              style={{ width: `${countdownPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
});
