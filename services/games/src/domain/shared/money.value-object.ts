export class Money {
  private constructor(private readonly cents: bigint) {
    if (cents < 0n) {
      throw new Error("Money value cannot be negative");
    }
  }

  static fromCents(cents: bigint) {
    return new Money(cents);
  }

  static zero() {
    return new Money(0n);
  }

  get valueInCents() {
    return this.cents;
  }

  add(other: Money) {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money) {
    return new Money(this.cents - other.cents);
  }

  isGreaterThanOrEqual(other: Money) {
    return this.cents >= other.cents;
  }

  equals(other: Money) {
    return this.cents === other.cents;
  }

  multiply(factor: number) {
    const factorScaled = BigInt(Math.round(factor * 100));
    return new Money((this.cents * factorScaled) / 100n);
  }
}
