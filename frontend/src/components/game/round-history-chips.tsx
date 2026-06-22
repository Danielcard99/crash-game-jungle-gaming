import type { RoundHistoryEntry } from "@/types/game";

interface Props {
  history: RoundHistoryEntry[];
}

export function RoundHistoryChips({ history }: Props) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Últimas {history.length || "…"} rodadas
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-danger" aria-hidden="true" /> &lt; 2x
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" /> ≥ 2x
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" /> ≥ 10x
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
              <span key={i} className="h-8 w-14 animate-pulse-glow rounded-md bg-muted" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
