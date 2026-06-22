import { describe, expect, it } from "bun:test";
import { GetRoundHistoryUseCase } from "../../src/application/use-cases/get-round-history.use-case";
import { Round } from "../../src/domain/round/round.aggregate";
import { RoundStatus } from "../../src/domain/round/round-status.enum";
import type { RoundRepository } from "../../src/domain/round/round.repository";

class FakeRoundRepository implements RoundRepository {
  private rounds: Round[] = [];

  async save(round: Round): Promise<void> {
    const index = this.rounds.findIndex((r) => r.id === round.id);
    if (index >= 0) this.rounds[index] = round;
    else this.rounds.push(round);
  }

  async findById(id: string): Promise<Round | null> {
    return this.rounds.find((r) => r.id === id) ?? null;
  }

  async findCurrentBettingRound(): Promise<Round | null> {
    return this.rounds.find((r) => r.status === RoundStatus.BETTING) ?? null;
  }

  async findLatestUnsettledRound(): Promise<Round | null> {
    return this.rounds.find((r) => r.status !== RoundStatus.SETTLED) ?? null;
  }

  async findSettledRounds(limit: number): Promise<Round[]> {
    return this.rounds
      .filter((r) => r.status === RoundStatus.SETTLED)
      .slice(0, limit);
  }
}

function createSettledRound(): Round {
  const round = Round.create({
    serverSeed: "seed",
    serverSeedHash: "hash",
    crashPoint: 2.0,
    bettingWindowSeconds: 10,
  });
  round.startRunning();
  round.crash();
  round.settle();
  return round;
}

describe("GetRoundHistoryUseCase", () => {
  it("retorna só rodadas liquidadas", async () => {
    const roundRepository = new FakeRoundRepository();

    const settledRound = createSettledRound();
    const bettingRound = Round.create({
      serverSeed: "seed2",
      serverSeedHash: "hash2",
      crashPoint: 3.0,
      bettingWindowSeconds: 10,
    });

    await roundRepository.save(settledRound);
    await roundRepository.save(bettingRound);

    const useCase = new GetRoundHistoryUseCase(roundRepository);
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(settledRound.id);
  });
});
