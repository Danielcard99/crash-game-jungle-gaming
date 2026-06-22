export function FormulaCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Fórmula da curva
      </h4>
      <code className="block break-all rounded bg-muted px-3 py-2 font-mono text-[11px] text-primary">
        m(t) = ⌊(1.06)^t × 100⌋ / 100
      </code>
      <p className="mt-2 text-[11px] text-muted-foreground">
        <span className="block">t = tempo em segundos decorridos</span>
        <span className="block mt-1">Crescimento: ~6% a cada segundo</span>
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground text-xs">
        O crash point é calculado separadamente via provably fair.
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">House edge: 1% · RTP: 99%</p>
    </div>
  );
}
