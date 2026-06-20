import { describe, expect, it } from "bun:test";
import { WalletTransaction } from "../../src/domain/wallet/wallet-transaction.aggregate";
import { Money } from "@crash/domain-kit";
import { WalletTransactionType } from "../../src/domain/wallet/wallet-transaction-type.enum";
import { WalletTransactionMapper } from "../../src/infrastructure/wallet/wallet-transaction.mapper";
import { Decimal } from "@prisma/client/runtime/wasm-compiler-edge";
import { WalletTransactionType as PrismaWalletTransactionType } from "../../generated/prisma/enums";

describe("WalletTransactionMapper.toPersistence", () => {
  it("converte walletTransaction de  domínio para o formato do Prisma", () => {
    const walletTransaction = WalletTransaction.create({
      walletId: "wallet-id",
      amount: Money.fromCents(1500n),
      type: WalletTransactionType.CREDIT,
      betId: "bet-id",
    });

    const persisted = WalletTransactionMapper.toPersistence(walletTransaction);

    expect(persisted.id).toBe(walletTransaction.id);
    expect(persisted.walletId).toBe(walletTransaction.walletId);
    expect(persisted.type).toBe(walletTransaction.type);
    expect(persisted.amount).toBe(1500);
    expect(persisted.betId).toBe(walletTransaction.betId);
    expect(persisted.createdAt).toEqual(walletTransaction.createdAt);
  });
});

describe("WalletTransactionMapper.toDomain", () => {
  it("converte walletTransaction do Prisma para o formato de domínio", () => {
    const persisted = {
      id: "transaction-id",
      walletId: "wallet-id",
      type: PrismaWalletTransactionType.DEBIT,
      amount: new Decimal(2000),
      betId: "bet-id",
      createdAt: new Date(),
    };

    const walletTransaction = WalletTransactionMapper.toDomain(persisted);

    expect(walletTransaction.id).toBe(persisted.id);
    expect(walletTransaction.walletId).toBe(persisted.walletId);
    expect(walletTransaction.type).toBe(WalletTransactionType.DEBIT);
    expect(walletTransaction.amount.valueInCents).toBe(2000n);
    expect(walletTransaction.betId).toBe(persisted.betId);
    expect(walletTransaction.createdAt).toEqual(persisted.createdAt);
  });
});
