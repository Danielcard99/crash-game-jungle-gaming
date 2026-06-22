import { useGameStore } from "@/stores/game.store";
import env from "@/lib/env";

export function ProvablyFairCard() {
  const phase = useGameStore((s) => s.phase);
  const crashSeeds = useGameStore((s) => s.crashSeeds);
  const serverSeedHash = useGameStore((s) => s.serverSeedHash);
  const roundId = useGameStore((s) => s.roundId);

  const isCrashed = phase === "crashed";

  return (
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
            {isCrashed && crashSeeds ? "Server seed revelada" : "Server seed hash (rodada atual)"}
          </p>
          <code className="mt-1 block break-all rounded bg-muted px-2 py-1.5 font-mono text-[11px] text-primary">
            {isCrashed && crashSeeds ? crashSeeds.serverSeed : (serverSeedHash ?? "—")}
          </code>
        </div>
        {roundId && isCrashed && (
          <a
            href={`${env.apiUrl}/games/rounds/${roundId}/verify`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-primary hover:underline"
          >
            Verificar rodada →
          </a>
        )}
      </div>
    </div>
  );
}
