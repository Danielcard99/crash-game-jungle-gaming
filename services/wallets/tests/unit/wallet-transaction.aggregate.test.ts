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

describe("WalletTransaction.reconstitute", () => {
  it("reconstitui uma transação a partir de dados persistidos", () => {
    const walletTransaction = WalletTransaction.reconstitute({
      id: "transaction-id-fake",
      walletId: "wallet-id-fake",
      type: WalletTransactionType.DEBIT,
      amount: Money.fromCents(500n),
      betId: "bet-id-fake",
      createdAt: new Date(),
    });

    expect(walletTransaction.id).toBe("transaction-id-fake");
    expect(walletTransaction.walletId).toBe("wallet-id-fake");
    expect(walletTransaction.type).toBe(WalletTransactionType.DEBIT);
    expect(walletTransaction.amount.valueInCents).toBe(500n);
    expect(walletTransaction.betId).toBe("bet-id-fake");
    expect(walletTransaction.createdAt).toBeInstanceOf(Date);
  });
});
