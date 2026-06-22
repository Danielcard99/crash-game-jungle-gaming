import { useState } from "react";
import { useGameStore } from "@/stores/game.store";
import env from "@/lib/env";

export function ProvablyFairCard() {
  const phase = useGameStore((s) => s.phase);
  const crashSeeds = useGameStore((s) => s.crashSeeds);
  const serverSeedHash = useGameStore((s) => s.serverSeedHash);
  const roundId = useGameStore((s) => s.roundId);
  const seedHistory = useGameStore((s) => s.seedHistory);
  const [showHistory, setShowHistory] = useState(false);

  const isCrashed = phase === "crashed";

  return (
    <>
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
          {isCrashed && crashSeeds && (
            <div>
              <p className="text-muted-foreground">Client seed revelada</p>
              <code className="mt-1 block break-all rounded bg-muted px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                {crashSeeds.clientSeed}
              </code>
            </div>
          )}
          {isCrashed && crashSeeds && (
            <div className="flex gap-4">
              <span className="text-muted-foreground">Nonce: <code className="font-mono text-primary">{crashSeeds.nonce}</code></span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {roundId && isCrashed && (
              <a
                href={`${env.apiUrl}/games/rounds/${roundId}/verify`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded bg-primary/10 py-1 text-center text-[11px] font-semibold text-primary hover:bg-primary/20"
              >
                Verificar →
              </a>
            )}
            {seedHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="cursor-pointer flex-1 rounded bg-muted py-1 text-center text-[11px] font-semibold text-muted-foreground hover:bg-border"
              >
                Histórico ({seedHistory.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Seed history modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Histórico de Seeds ({seedHistory.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {seedHistory.map((seed, idx) => (
                <div key={idx} className="rounded-lg border border-border/50 bg-background p-4">
                  {/* Header - Rodada e Crash Point */}
                  <div className="mb-3 flex items-center justify-between border-b border-border/30 pb-2">
                    <span className="text-[12px] font-mono font-semibold text-primary">
                      Rodada {seedHistory.length - idx}{seed.roundId ? ` (${seed.roundId.slice(0, 8)})` : ""}
                    </span>
                    <span className="text-[12px] font-mono text-success">{seed.crashPoint.toFixed(2)}x</span>
                  </div>

                  {/* Data grid */}
                  <div className="space-y-2 text-[11px]">
                    {/* Server Seed */}
                    <div>
                      <p className="mb-1 font-semibold text-muted-foreground">Server Seed (Revelada)</p>
                      <code className="block break-all rounded bg-muted/50 px-2 py-1.5 font-mono text-[10px] text-primary">
                        {seed.serverSeed}
                      </code>
                    </div>

                    {/* Server Seed Hash */}
                    <div>
                      <p className="mb-1 font-semibold text-muted-foreground">Server Seed Hash</p>
                      <code className="block break-all rounded bg-muted/50 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
                        {seed.serverSeedHash}
                      </code>
                    </div>

                    {/* Client Seed - opcional */}
                    {seed.clientSeed && (
                      <div>
                        <p className="mb-1 font-semibold text-muted-foreground">Client Seed</p>
                        <code className="block break-all rounded bg-muted/50 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
                          {seed.clientSeed}
                        </code>
                      </div>
                    )}

                    {/* Nonce - opcional */}
                    {seed.nonce !== undefined && (
                      <div>
                        <p className="mb-1 font-semibold text-muted-foreground">Nonce</p>
                        <code className="block rounded bg-muted/50 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
                          {seed.nonce}
                        </code>
                      </div>
                    )}

                    {/* HMAC - opcional */}
                    {seed.hmac && (
                      <div>
                        <p className="mb-1 font-semibold text-muted-foreground">HMAC (SHA256)</p>
                        <code className="block break-all rounded bg-muted/50 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
                          {seed.hmac}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="mt-4 w-full cursor-pointer rounded-lg border border-border bg-background py-2 text-sm font-semibold hover:bg-border"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
