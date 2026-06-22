import { describe, expect, it } from "bun:test";
import { Bet } from "../../src/domain/bet/bet.aggregate";
import { BetAmount } from "../../src/domain/bet/bet-amount.value-object";
import { BetMapper } from "../../src/infrastructure/bet/bet.mapper";
import { Decimal } from "@prisma/client/runtime/wasm-compiler-edge";
import { BetStatus as PrismaBetStatus } from "../../generated/prisma/enums";

describe("BetMapper.toPersistence", () => {
  it("converte Bet de domínio para o formato do Prisma", () => {
    const bet = Bet.create({
      roundId: "round-id-fake",
      playerId: "user-id-fake",
      amountBet: BetAmount.create(1000n),
      playerUsername: "player-username-fake",
      autoCashoutMultiplier: null,
    });
    const persisted = BetMapper.toPersistence(bet);

    expect(persisted.id).toBe(bet.id);
    expect(persisted.amountBet).toBe(1000);
  });
});

describe("BetMapper.toDomain", () => {
  it("converte Bet do Prisma para o formato de domínio", () => {
    const persisted = {
      id: "bet-id-fake",
      roundId: "round-id-fake",
      playerId: "user-id-fake",
      playerUsername: "player-username-fake",
      amountBet: new Decimal(1000),
      status: PrismaBetStatus.CASHED_OUT,
      cashoutMultiplier: new Decimal(2.35),
      payout: new Decimal(2350),
      placedAt: new Date(),
      cashedOutAt: new Date(),
      autoCashoutMultiplier: null,
    };

    const bet = BetMapper.toDomain(persisted);

    expect(bet.id).toBe(persisted.id);
    expect(bet.amountBet.valueInCents).toBe(1000n);
    expect(bet.cashoutMultiplier).toBe(2.35);
    expect(bet.payout?.valueInCents).toBe(2350n);
  });
});
