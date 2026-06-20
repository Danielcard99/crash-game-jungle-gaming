import { describe, expect, it } from "bun:test";
import { BetAmount } from "../../src/domain/bet/bet-amount.value-object";

describe("BetAmount.create", () => {
  it("aceita valor dentro da faixa permitida", () => {
    expect(() => BetAmount.create(1000n)).not.toThrow();
  });

  it("aceita o valor mínimo exato (R$1,00)", () => {
    expect(() => BetAmount.create(100n)).not.toThrow();
  });

  it("aceita o valor máximo exato (R$1.000,00)", () => {
    expect(() => BetAmount.create(100_000n)).not.toThrow();
  });

  it("lança erro abaixo do mínimo (R$1,00)", () => {
    expect(() => BetAmount.create(99n)).toThrow(
      "Bet amount must be between R$1 and R$1000",
    );
  });

  it("lança erro acima do máximo (R$1.000,00)", () => {
    expect(() => BetAmount.create(100_001n)).toThrow(
      "Bet amount must be between R$1 and R$1000",
    );
  });

  it("retorna o valor em centavos corretamente", () => {
    const betAmount = BetAmount.create(1000n);
    expect(betAmount.valueInCents).toBe(1000n);
  });
});
