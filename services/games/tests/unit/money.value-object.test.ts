import { describe, expect, it } from "bun:test";
import { Money } from "../../src/domain/shared/money.value-object";

describe("Money.fromCents", () => {
  it("lança erro ao criar com valor negativo", () => {
    expect(() => Money.fromCents(-100n)).toThrow(
      "Money value cannot be negative",
    );
  });
});

describe("Money.add", () => {
  it("soma corretamente dois valores de Money", () => {
    const money1 = Money.fromCents(100n);
    const money2 = Money.fromCents(50n);
    const result = money1.add(money2);
    expect(result.valueInCents).toBe(150n);
  });
});

describe("Money.subtract", () => {
  it("subtrai corretamente dois valores de Money", () => {
    const money1 = Money.fromCents(100n);
    const money2 = Money.fromCents(50n);
    const result = money1.subtract(money2);
    expect(result.valueInCents).toBe(50n);
  });

  it("lança erro ao subtrair resultando em valor negativo", () => {
    const money1 = Money.fromCents(100n);
    const money2 = Money.fromCents(150n);
    expect(() => money1.subtract(money2)).toThrow(
      "Money value cannot be negative",
    );
  });
});

describe("Money.multiply", () => {
  it("multiplica corretamente por um fator decimal", () => {
    const money = Money.fromCents(1000n);
    const result = money.multiply(2.35);
    expect(result.valueInCents).toBe(2350n);
  });
});

describe("Money.isGreaterThanOrEqual", () => {
  it("retorna true quando o valor é maior ou igual a outro", () => {
    const money1 = Money.fromCents(100n);
    const money2 = Money.fromCents(50n);
    expect(money1.isGreaterThanOrEqual(money2)).toBe(true);
  });
});

describe("Money.equals", () => {
  it("retorna true quando os valores são iguais", () => {
    const money1 = Money.fromCents(100n);
    const money2 = Money.fromCents(100n);
    expect(money1.equals(money2)).toBe(true);
  });
});

describe("Money.zero", () => {
  it("cria um valor de Money igual a zero", () => {
    const money = Money.zero();
    expect(money.valueInCents).toBe(0n);
  });
});
