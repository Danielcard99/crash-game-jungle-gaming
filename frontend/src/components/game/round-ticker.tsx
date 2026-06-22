import type { RoundHistoryEntry } from "@/types/game";

interface Props {
  history: RoundHistoryEntry[];
}

export function RoundTicker({ history }: Props) {
  return (
    <div className="overflow-hidden border-b border-border/60 bg-card/40">
      {history.length > 0 ? (
        <div className="flex w-max animate-ticker gap-6 py-2.5 text-xs font-mono">
          {[...history, ...history, ...history].map((h, i) => (
            <span
              key={`${h.id}-${i}`}
              aria-label={`Rodada crashou em ${h.crashPoint.toFixed(2)}x`}
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
  );
}
