import { describe, it, expect, beforeEach } from "bun:test";
import { Round } from "../../src/domain/round/round.aggregate";
import { RoundStatus } from "../../src/domain/round/round-status.enum";

describe("Round.create", () => {
  it("nasce em status BETTING", () => {
    const round = Round.create({
      serverSeed: "seed-fake",
      serverSeedHash: "hash-fake",
      crashPoint: 2.35,
      bettingWindowSeconds: 10,
    });
    expect(round.status).toBe(RoundStatus.BETTING);
  });
});

describe("Round.startRunning", () => {
  let round: Round;

  beforeEach(() => {
    round = Round.create({
      serverSeed: "seed-fake",
      serverSeedHash: "hash-fake",
      crashPoint: 2.35,
      bettingWindowSeconds: 10,
    });
  });

  it("muda o status para Running quando a rodada está em BETTING", () => {
    round.startRunning();
    expect(round.status).toBe(RoundStatus.RUNNING);
  });

  it("lança um erro quando a rodada não está em BETTING", () => {
    round.startRunning();
    expect(() => round.startRunning()).toThrow(
      "status must be BETTING to start running",
    );
  });
});

describe("Round.crash", () => {
  let round: Round;

  beforeEach(() => {
    round = Round.create({
      serverSeed: "seed-fake",
      serverSeedHash: "hash-fake",
      crashPoint: 2.35,
      bettingWindowSeconds: 10,
    });
    round.startRunning();
  });

  it("muda o status para CRASHED quando a rodada está em RUNNING", () => {
    round.crash();
    expect(round.status).toBe(RoundStatus.CRASHED);
  });

  it("lança um erro quando a rodada não está em RUNNING", () => {
    round.crash();
    expect(() => round.crash()).toThrow("status must be RUNNING to crash");
  });
});

describe("Round.settle", () => {
  let round: Round;

  beforeEach(() => {
    round = Round.create({
      serverSeed: "seed-fake",
      serverSeedHash: "hash-fake",
      crashPoint: 2.35,
      bettingWindowSeconds: 10,
    });
    round.startRunning();
    round.crash();
  });

  it("muda o status para SETTLED quando a rodada está em CRASHED", () => {
    round.settle();
    expect(round.status).toBe(RoundStatus.SETTLED);
  });

  it("lança um erro quando a rodada não está em CRASHED", () => {
    round.settle();
    expect(() => round.settle()).toThrow("status must be CRASHED to settle");
  });
});

describe("Round.reconstitute", () => {
  it("reconstitui uma rodada a partir de dados persistidos", () => {
    const round = Round.reconstitute({
      id: "round-id-fake",
      status: RoundStatus.CRASHED,
      serverSeed: "seed-fake",
      serverSeedHash: "hash-fake",
      crashPoint: 2.35,
      bettingStartedAt: new Date(),
      bettingEndsAt: new Date(),
      startedAt: new Date(),
      crashedAt: new Date(),
      settledAt: null,
      createdAt: new Date(),
    });

    expect(round.status).toBe(RoundStatus.CRASHED);
    expect(round.crashPoint).toBe(2.35);
  });
});
