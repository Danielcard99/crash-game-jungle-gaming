import { useState, memo } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useGameStore } from "@/stores/game.store";
import { useAuthStore } from "@/stores/auth.store";
import { useWallet } from "@/hooks/use-wallet";
import { usePlaceBet } from "@/hooks/use-place-bet";
import { useCashout } from "@/hooks/use-cashout";
import { formatCurrency, formatMultiplier } from "@/lib/format";

// Reads multiplier every tick — isolated so BetPanel itself only re-renders on
// phase/myActiveBet/betInput changes.
const PayoutDisplay = memo(function PayoutDisplay({ betInput }: { betInput: number }) {
  const multiplier = useGameStore((s) => s.multiplier);
  const myActiveBet = useGameStore((s) => s.myActiveBet);
  const potentialPayoutR = myActiveBet
    ? (myActiveBet.amount / 100) * multiplier
    : betInput * multiplier;
  return <>{formatCurrency(Math.round(potentialPayoutR * 100))}</>;
});

export function BetPanel() {
  const phase = useGameStore((s) => s.phase);
  const myActiveBet = useGameStore((s) => s.myActiveBet);
  const roundNumber = useGameStore((s) => s.roundNumber);
  const autoCashoutEnabled = useGameStore((s) => s.autoCashoutEnabled);
  const setAutoCashoutEnabled = useGameStore((s) => s.setAutoCashoutEnabled);

  const authState = useAuthStore();
  const { data: wallet } = useWallet();
  const placeBet = usePlaceBet();
  const cashout = useCashout();

  const [betInput, setBetInput] = useState(100);
  const [autoCashoutInput, setAutoCashoutInput] = useState("2.00");

  const balanceCents = wallet?.balance ?? 0;
  const amountCents = Math.round(betInput * 100);
  const canBet = phase === "betting" && !myActiveBet && authState.isAuthenticated;
  const canCashout = phase === "in_progress" && !!myActiveBet;

  const roundLabel = roundNumber ? `#${roundNumber.toLocaleString("pt-BR")}` : "—";

  function handleBet() {
    if (betInput < 1) {
      toast.error("Aposta inválida", { description: "Valor mínimo é R$ 1,00." });
      return;
    }
    if (betInput > 1000) {
      toast.error("Aposta inválida", { description: "Valor máximo é R$ 1.000,00." });
      return;
    }
    if (amountCents > balanceCents) {
      toast.error("Saldo insuficiente", {
        description: "Faça um depósito para continuar apostando.",
      });
      return;
    }
    const autoCashout = autoCashoutEnabled ? parseFloat(autoCashoutInput.replace(",", ".")) : undefined;
    placeBet.mutate(
      { amount: amountCents, autoCashout: autoCashout && autoCashout >= 1.01 ? autoCashout : undefined },
      {
        onSuccess: () =>
          toast.success("Aposta confirmada!", {
            description: `${formatCurrency(amountCents)} na rodada ${roundLabel}`,
          }),
        onError: (err) => toast.error("Erro ao apostar", { description: err.message }),
      },
    );
  }

  function handleCashout() {
    cashout.mutate(undefined, {
      onSuccess: (data) => {
        const mult = data.cashoutMultiplier ?? useGameStore.getState().multiplier;
        toast.success("Cash out realizado!", {
          description: `Você sacou em ${formatMultiplier(mult)} · ${formatCurrency(data.payout ?? 0)}`,
        });
      },
      onError: (err) => toast.error("Erro ao sacar", { description: err.message }),
    });
  }

  if (!authState.isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <p className="text-sm text-muted-foreground">Faça login para apostar</p>
          <Link
            to="/login"
            className="w-full rounded-xl bg-[image:var(--gradient-rocket)] py-3 text-center font-display font-bold text-primary-foreground shadow-glow transition hover:opacity-95"
          >
            Entrar para apostar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <label
        htmlFor="bet-amount"
        className="text-xs uppercase tracking-wider text-muted-foreground"
      >
        Valor da aposta
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <span className="text-muted-foreground">R$</span>
        <input
          id="bet-amount"
          type="number"
          value={betInput}
          onChange={(e) => setBetInput(Number(e.target.value))}
          disabled={!canBet}
          className="w-full bg-transparent font-mono text-lg outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setBetInput((b) => Math.max(1, Math.round(b / 2)))}
          disabled={!canBet}
          className="cursor-pointer rounded border border-border px-2 py-0.5 text-xs disabled:opacity-40"
        >
          ½
        </button>
        <button
          type="button"
          onClick={() => setBetInput((b) => Math.min(1000, b * 2))}
          disabled={!canBet}
          className="cursor-pointer rounded border border-border px-2 py-0.5 text-xs disabled:opacity-40"
        >
          2×
        </button>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Mín. R$ 1,00 · Máx. R$ 1.000,00</p>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {[50, 100, 500, 1000].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setBetInput(v)}
            disabled={!canBet}
            className="cursor-pointer rounded-md border border-border bg-background py-1.5 font-mono text-sm transition hover:border-primary disabled:opacity-40"
          >
            {v}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="auto-cashout"
            className="text-xs uppercase tracking-wider text-muted-foreground"
          >
            Saque automático em
          </label>
          <button
            type="button"
            onClick={() => setAutoCashoutEnabled(!autoCashoutEnabled)}
            className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-semibold uppercase transition ${
              autoCashoutEnabled
                ? "bg-success/20 text-success"
                : "bg-muted text-muted-foreground hover:bg-border"
            }`}
          >
            {autoCashoutEnabled ? "ON" : "OFF"}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <input
            id="auto-cashout"
            value={autoCashoutInput}
            onChange={(e) => setAutoCashoutInput(e.target.value)}
            disabled={!!myActiveBet || !autoCashoutEnabled}
            className="w-full bg-transparent font-mono text-lg outline-none disabled:opacity-50"
          />
          <span className="font-mono text-muted-foreground">x</span>
        </div>
      </div>

      {/* Apostar — visible outside active round */}
      {phase !== "in_progress" && (
        <button
          type="button"
          onClick={handleBet}
          disabled={!canBet || placeBet.isPending}
          className="mt-5 w-full cursor-pointer rounded-xl bg-[image:var(--gradient-rocket)] py-4 font-display text-lg font-bold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {placeBet.isPending
            ? "Aguardando…"
            : myActiveBet
              ? `Apostado ${formatCurrency(myActiveBet.amount)}`
              : `Apostar R$ ${betInput}`}
        </button>
      )}

      {/* SACAR — visible during active round */}
      {(phase === "in_progress" || phase === "crashed") && (
        <button
          type="button"
          onClick={handleCashout}
          disabled={!canCashout || cashout.isPending}
          className="mt-2 flex w-full cursor-pointer items-center justify-between rounded-xl border-2 border-success bg-success/15 px-5 py-4 font-display font-bold text-success shadow-accent-glow transition hover:bg-success/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-lg">{cashout.isPending ? "SACANDO…" : "SACAR"}</span>
          <span className="font-mono text-xl">
            <PayoutDisplay betInput={betInput} />
          </span>
        </button>
      )}

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Ganho potencial:{" "}
        <span className="font-mono text-primary">
          <PayoutDisplay betInput={betInput} />
        </span>
      </p>
    </div>
  );
}
