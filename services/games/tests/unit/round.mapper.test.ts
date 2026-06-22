import { describe, expect, it } from "bun:test";
import { Round } from "../../src/domain/round/round.aggregate";
import { RoundMapper } from "../../src/infrastructure/round/round.mapper";
import { RoundStatus } from "../../src/domain/round/round-status.enum";
import { Decimal } from "@prisma/client/runtime/wasm-compiler-edge";

describe("RoundMapper.toPersistence", () => {
  it("converte um Round de domínio pro formato do Prisma", () => {
    const round = Round.create({
      serverSeed: "seed-fake",
      serverSeedHash: "hash-fake",
      clientSeed: "client-fake",
      nonce: 0,
      crashPoint: 2.5,
      bettingWindowSeconds: 10,
    });
    const persisted = RoundMapper.toPersistence(round);

    expect(persisted.id).toBe(round.id);
    expect(persisted.crashPoint).toBe(round.crashPoint);
  });
});

describe("RoundMapper.toDomain", () => {
  it("converte um Round do Prisma pro formato de domínio", () => {
    const now = new Date();
    const persisted = {
      id: "round-id",
      status: RoundStatus.BETTING,
      serverSeed: "seed-fake",
      serverSeedHash: "hash-fake",
      clientSeed: "client-fake",
      nonce: 0,
      crashPoint: new Decimal(2.5),
      bettingStartedAt: now,
      bettingEndsAt: new Date(now.getTime() + 10000),
      startedAt: null,
      crashedAt: null,
      settledAt: null,
      createdAt: now,
    };

    const round = RoundMapper.toDomain(persisted);

    expect(round.id).toBe(persisted.id);
    expect(round.crashPoint).toBe(2.5);
  });
});
