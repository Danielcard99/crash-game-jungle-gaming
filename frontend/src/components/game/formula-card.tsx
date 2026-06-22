export function FormulaCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Fórmula da curva
      </h4>
      <code className="block break-all rounded bg-muted px-3 py-2 font-mono text-[11px] text-primary">
        m(t) = 1.00 · e^(0.06 · t)
      </code>
      <p className="mt-2 text-[11px] text-muted-foreground">House edge: 1% · RTP: 99%</p>
    </div>
  );
}
