import { useGameStore } from "@/stores/game.store";
import { useAuthStore } from "@/stores/auth.store";
import { formatCurrency } from "@/lib/format";

export function LiveBetsTable() {
  const liveBets = useGameStore((s) => s.liveBets);
  const phase = useGameStore((s) => s.phase);
  const username = useAuthStore((s) => s.user?.preferred_username);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Apostas da rodada
        </h3>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-success"
            aria-hidden="true"
          />
          {liveBets.length} jogadores · {formatCurrency(liveBets.reduce((s, b) => s + b.amount, 0))}
        </span>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-background/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-5 py-2 text-left font-semibold">
              Jogador
            </th>
            <th scope="col" className="px-3 py-2 text-left font-semibold">
              Aposta
            </th>
            <th scope="col" className="px-3 py-2 text-left font-semibold">
              Cashout
            </th>
            <th scope="col" className="px-3 py-2 text-left font-semibold">
              Status
            </th>
            <th scope="col" className="px-5 py-2 text-right font-semibold">
              Ganho
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {liveBets.map((b) => (
            <tr
              key={b.userId}
              className={`text-sm ${
                b.status === "won" ? "bg-success/5" : b.status === "lost" ? "bg-danger/5" : ""
              } ${b.username === username ? "ring-1 ring-inset ring-primary/30" : ""}`}
            >
              <td className="px-5 py-3 font-medium">
                <span className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase"
                    aria-hidden="true"
                  >
                    {b.username[0]}
                  </span>
                  @{b.username}
                </span>
              </td>
              <td className="px-3 py-3 font-mono text-muted-foreground">
                {formatCurrency(b.amount)}
              </td>
              <td
                className={`px-3 py-3 font-mono ${
                  b.cashoutMultiplier === null ? "text-muted-foreground" : "text-primary"
                }`}
              >
                {b.cashoutMultiplier !== null ? `${b.cashoutMultiplier.toFixed(2)}x` : "—"}
              </td>
              <td className="px-3 py-3">
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
              </td>
              <td
                className={`px-5 py-3 text-right font-mono font-semibold ${
                  b.payout && b.payout > 0 ? "text-success" : "text-muted-foreground"
                }`}
              >
                {b.payout && b.payout > 0 ? `+${formatCurrency(b.payout)}` : "—"}
              </td>
            </tr>
          ))}

          {liveBets.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-6 text-center text-xs text-muted-foreground">
                {phase === "betting" ? "Aguardando apostas…" : "Sem apostas nesta rodada."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
