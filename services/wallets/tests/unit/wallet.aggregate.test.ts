import { describe, expect, it } from "bun:test";
import { Wallet } from "../../src/domain/wallet/wallet.aggregate";
import { Money } from "@crash/domain-kit";

describe("Wallet.create", () => {
  it("nasce com o balance zero", () => {
    const wallet = Wallet.create({
      playerId: "user-id-fake",
    });
    expect(wallet.balance.valueInCents).toBe(0n);
  });
});

describe("Wallet.credit", () => {
  it("credita corretamente e incrementa a version", () => {
    const wallet = Wallet.create({
      playerId: "user-id-fake",
    });
    wallet.credit(Money.fromCents(1000n));

    expect(wallet.balance.valueInCents).toBe(1000n);
    expect(wallet.version).toBe(1);
  });
});

describe("Wallet.debit", () => {
  it("debita corretamente e incrementa a version", () => {
    const wallet = Wallet.create({
      playerId: "user-id-fake",
    });
    wallet.credit(Money.fromCents(1000n));
    wallet.debit(Money.fromCents(400n));

    expect(wallet.balance.valueInCents).toBe(600n);
    expect(wallet.version).toBe(2);
  });

  it("lança erro quando o saldo é insuficiente e não altera balance nem version", () => {
    const wallet = Wallet.create({ playerId: "user-id-fake" });
    wallet.credit(Money.fromCents(1000n));

    expect(() => wallet.debit(Money.fromCents(2000n))).toThrow(
      "Insufficient balance",
    );

    expect(wallet.balance.valueInCents).toBe(1000n);
    expect(wallet.version).toBe(1);
  });
});

describe("Wallet.reconstitute", () => {
  it("reconstitui corretamente a partir de um estado", () => {
    const wallet = Wallet.reconstitute({
      id: "wallet-id-fake",
      playerId: "user-id-fake",
      balance: Money.fromCents(500n),
      version: 3,
    });

    expect(wallet.id).toBe("wallet-id-fake");
    expect(wallet.playerId).toBe("user-id-fake");
    expect(wallet.balance.valueInCents).toBe(500n);
    expect(wallet.version).toBe(3);
  });
});


