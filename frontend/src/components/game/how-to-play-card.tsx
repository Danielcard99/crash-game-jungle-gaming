export function HowToPlayCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Como jogar
      </h4>
      <ol className="space-y-2 text-sm text-muted-foreground">
        <li>
          <span className="mr-2 font-mono text-primary">01.</span>Faça sua aposta antes da rodada.
        </li>
        <li>
          <span className="mr-2 font-mono text-primary">02.</span>O foguete decola e o multiplicador
          sobe.
        </li>
        <li>
          <span className="mr-2 font-mono text-primary">03.</span>Saque antes do crash para ganhar.
        </li>
      </ol>
    </div>
  );
}
