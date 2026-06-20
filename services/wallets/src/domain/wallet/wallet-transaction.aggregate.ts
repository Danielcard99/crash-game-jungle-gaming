import { Money } from "@crash/domain-kit";
import { WalletTransactionType } from "./wallet-transaction-type.enum";

export class WalletTransaction {
  private constructor(
    private readonly _id: string,
    private readonly _walletId: string,
    private readonly _type: WalletTransactionType,
    private readonly _amount: Money,
    private readonly _betId: string,
    private readonly _createdAt: Date,
  ) {}

  static create(params: {
    walletId: string;
    type: WalletTransactionType;
    amount: Money;
    betId: string;
  }) {
    const now = new Date();

    return new WalletTransaction(
      crypto.randomUUID(),
      params.walletId,
      params.type,
      params.amount,
      params.betId,
      now,
    );
  }

  get id() {
    return this._id;
  }

  get walletId() {
    return this._walletId;
  }

  get type() {
    return this._type;
  }

  get amount() {
    return this._amount;
  }

  get betId() {
    return this._betId;
  }

  get createdAt() {
    return this._createdAt;
  }
}
