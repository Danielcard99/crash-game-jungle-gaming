import { describe, expect, it } from "bun:test";
import { GetCurrentRoundUseCase } from "../../src/application/use-cases/get-current-round.use-case";
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

function createBettingRound(): Round {
  return Round.create({
    serverSeed: "seed",
    serverSeedHash: "hash",
      clientSeed: "client-fake",
      nonce: 0,
    crashPoint: 2.0,
    bettingWindowSeconds: 10,
  });
}

describe("GetCurrentRoundUseCase", () => {
  it("retorna a rodada atual quando existe uma não liquidada", async () => {
    const roundRepository = new FakeRoundRepository();
    const round = createBettingRound();
    await roundRepository.save(round);

    const useCase = new GetCurrentRoundUseCase(roundRepository);
    const result = await useCase.execute();

    expect(result.id).toBe(round.id);
  });

  it("lança erro quando não há rodada ativa", async () => {
    const roundRepository = new FakeRoundRepository();
    const useCase = new GetCurrentRoundUseCase(roundRepository);

    await expect(useCase.execute()).rejects.toThrow(
      "No active round at the moment",
    );
  });
});
