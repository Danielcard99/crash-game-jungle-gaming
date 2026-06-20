import { beforeEach, describe, expect, it } from "bun:test";
import { Bet } from "../../src/domain/bet/bet.aggregate";
import { BetStatus } from "../../src/domain/bet/bet-status.enum";
import { BetAmount } from "../../src/domain/bet/bet-amount.value-object";
import { Money } from "@crash/domain-kit";

describe("Bet.create", () => {
  it("nasce em status PENDING", () => {
    const bet = Bet.create({
      roundId: "round-id-fake",
      playerId: "user-id-fake",
      amountBet: BetAmount.create(1000n),
      playerUsername: "player-username-fake",
    });
    expect(bet.status).toBe(BetStatus.PENDING);
  });

  it("guarda o amountBet que foi passado", () => {
    const betAmount = BetAmount.create(1000n);
    const bet = Bet.create({
      roundId: "round-id-fake",
      playerId: "user-id-fake",
      amountBet: betAmount,
      playerUsername: "player-username-fake",
    });
    expect(bet.amountBet).toBe(betAmount);
  });
});

describe("Bet.confirm", () => {
  it("muda o status para ACTIVE quando a aposta está em PENDING", () => {
    const bet = Bet.create({
      roundId: "round-id-fake",
      playerId: "user-id-fake",
      amountBet: BetAmount.create(1000n),
      playerUsername: "player-username-fake",
    });
    bet.confirm();
    expect(bet.status).toBe(BetStatus.ACTIVE);
  });

  it("lança um erro quando a aposta não está em PENDING", () => {
    const bet = Bet.create({
      roundId: "round-id-fake",
      playerId: "user-id-fake",
      amountBet: BetAmount.create(1000n),
      playerUsername: "player-username-fake",
    });
    bet.confirm();
    expect(() => bet.confirm()).toThrow(
      "Only bets in PENDING status can be confirmed",
    );
  });
});

describe("Bet.reject", () => {
  it("muda o status para REJECTED quando a aposta está em PENDING", () => {
    const bet = Bet.create({
      roundId: "round-id-fake",
      playerId: "user-id-fake",
      amountBet: BetAmount.create(1000n),
      playerUsername: "player-username-fake",
    });
    bet.reject();
    expect(bet.status).toBe(BetStatus.REJECTED);
  });

  it("lança um erro quando a aposta não está em PENDING", () => {
    const bet = Bet.create({
      roundId: "round-id-fake",
      playerId: "user-id-fake",
      amountBet: BetAmount.create(1000n),
      playerUsername: "player-username-fake",
    });
    bet.confirm();
    expect(() => bet.reject()).toThrow(
      "Only bets in PENDING status can be rejected",
    );
  });
});

describe("Bet.cashOut", () => {
  let bet: Bet;

  beforeEach(() => {
    bet = Bet.create({
      roundId: "round-id-fake",
      playerId: "user-id-fake",
      amountBet: BetAmount.create(1000n),
      playerUsername: "player-username-fake",
    });
    bet.confirm();
  });

  it("muda o status para CASHED_OUT e calcula o payout corretamente", () => {
    bet.cashOut(2.35);

    expect(bet.status).toBe(BetStatus.CASHED_OUT);
    expect(bet.cashoutMultiplier).toBe(2.35);
    expect(bet.payout?.valueInCents).toBe(2350n);
  });

  it("lança um erro quando a aposta não está em ACTIVE", () => {
    bet.cashOut(2.35);
    expect(() => bet.cashOut(2.5)).toThrow(
      "Only bets in ACTIVE status can be cashed out",
    );
  });
});

describe("Bet.markAsLost", () => {
  let bet: Bet;

  beforeEach(() => {
    bet = Bet.create({
      roundId: "round-id-fake",
      playerId: "user-id-fake",
      amountBet: BetAmount.create(1000n),
      playerUsername: "player-username-fake",
    });
    bet.confirm();
  });

  it("muda o status para LOST quando a aposta está em ACTIVE", () => {
    bet.markAsLost();
    expect(bet.status).toBe(BetStatus.LOST);
  });

  it("lança um erro quando a aposta não está em ACTIVE", () => {
    bet.markAsLost();
    expect(() => bet.markAsLost()).toThrow(
      "Only bets in ACTIVE status can be marked as lost",
    );
  });
});

describe("Bet.reconstitute", () => {
  it("reconstitui uma aposta a partir de dados persistidos", () => {
    const bet = Bet.reconstitute({
      id: "bet-id-fake",
      roundId: "round-id-fake",
      playerId: "user-id-fake",
      playerUsername: "player-username-fake",
      amountBet: BetAmount.create(1000n),
      status: BetStatus.CASHED_OUT,
      cashoutMultiplier: 2.35,
      payout: Money.fromCents(2350n),
      placedAt: new Date(),
      cashedOutAt: new Date(),
    });

    expect(bet.status).toBe(BetStatus.CASHED_OUT);
    expect(bet.cashoutMultiplier).toBe(2.35);
    expect(bet.payout?.valueInCents).toBe(2350n);
  });
});
