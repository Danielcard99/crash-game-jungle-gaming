import { describe, expect, it } from "bun:test";
import { Wallet } from "../../src/domain/wallet/wallet.aggregate";
import { WalletMapper } from "../../src/infrastructure/wallet/wallet.mapper";
import { Money } from "@crash/domain-kit";
import { Decimal } from "@prisma/client/runtime/wasm-compiler-edge";

describe("WalletMapper.toPersistence", () => {
  it("converte Wallet de domínio pro formato do Prisma", () => {
    const wallet = Wallet.create({
      playerId: "user-id-fake",
    });

    const persisted = WalletMapper.toPersistence(wallet);

    expect(persisted.id).toBe(wallet.id);
    expect(persisted.playerId).toBe(wallet.playerId);
    expect(persisted.balance).toBe(0);
    expect(persisted.version).toBe(0);
  });

  it("converte Wallet com saldo creditado pro formato do Prisma", () => {
    const wallet = Wallet.create({ playerId: "user-id-fake" });
    wallet.credit(Money.fromCents(1500n));

    const persisted = WalletMapper.toPersistence(wallet);

    expect(persisted.balance).toBe(1500);
    expect(persisted.version).toBe(1);
  });
});

describe("WalletMapper.toDomain", () => {
  it("converte Wallet do Prisma pro formato de domínio", () => {
    const persisted = {
      id: "wallet-id",
      playerId: "user-id-fake",
      balance: new Decimal(100),
      version: 1,
    };

    const wallet = WalletMapper.toDomain(persisted);

    expect(wallet.id).toBe(persisted.id);
    expect(wallet.playerId).toBe(persisted.playerId);
    expect(wallet.balance.valueInCents).toBe(100n);
    expect(wallet.version).toBe(persisted.version);
  });
});
