import { Money } from "@crash/domain-kit";

export class Wallet {
  private constructor(
    private readonly _id: string,
    private readonly _playerId: string,
    private _balance: Money,
    private _version: number,
  ) {}

  static create(params: { playerId: string }) {
    return new Wallet(crypto.randomUUID(), params.playerId, Money.zero(), 0);
  }

  credit(amount: Money) {
    this._balance = this._balance.add(amount);
    this._version++;
  }

  debit(amount: Money) {
    if (!this._balance.isGreaterThanOrEqual(amount)) {
      throw new Error("Insufficient balance");
    }

    this._balance = this._balance.subtract(amount);
    this._version++;
  }

  get balance() {
    return this._balance;
  }

  get version() {
    return this._version;
  }
}
