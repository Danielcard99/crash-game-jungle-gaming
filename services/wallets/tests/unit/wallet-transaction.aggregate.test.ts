import { Money } from "@crash/domain-kit";
import { describe, expect, it } from "bun:test";
import { WalletTransactionType } from "../../src/domain/wallet/wallet-transaction-type.enum";
import { WalletTransaction } from "../../src/domain/wallet/wallet-transaction.aggregate";

describe("WalletTransaction.create", () => {
  it("cria uma transação com dados corretos", () => {
    const walletTransaction = WalletTransaction.create({
      walletId: "wallet-id-fake",
      type: WalletTransactionType.CREDIT,
      amount: Money.fromCents(1000n),
      betId: "bet-id-fake",
    });

    expect(walletTransaction.walletId).toBe("wallet-id-fake");
    expect(walletTransaction.type).toBe(WalletTransactionType.CREDIT);
    expect(walletTransaction.amount.valueInCents).toBe(1000n);
    expect(walletTransaction.betId).toBe("bet-id-fake");
    expect(walletTransaction.createdAt).toBeInstanceOf(Date);
    expect(walletTransaction.id).toBeDefined();
  });
});
