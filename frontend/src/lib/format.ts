const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(cents: number): string {
  return brlFormatter.format(cents / 100);
}

export function formatMultiplier(mult: number): string {
  return `${mult.toFixed(2)}x`;
}
