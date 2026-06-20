import { Money } from "../shared/money.value-object";

export class BetAmount {
  private static readonly MIN_CENTS = 100n; // R$1,00
  private static readonly MAX_CENTS = 100_000n; // R$1.000,00

  private constructor(private readonly money: Money) {}

  static create(cents: bigint) {
    if (cents < BetAmount.MIN_CENTS || cents > BetAmount.MAX_CENTS) {
      throw new Error(
        `Bet amount must be between R$${BetAmount.MIN_CENTS / 100n} and R$${BetAmount.MAX_CENTS / 100n}`,
      );
    }

    return new BetAmount(Money.fromCents(cents));
  }

  get valueInCents() {
    return this.money.valueInCents;
  }

  toMoney() {
    return this.money;
  }
}
