import { describe, expect, it } from "bun:test";
import { VerifyRoundUseCase } from "../../src/application/use-cases/verify-round.use-case";
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

describe("VerifyRoundUseCase", () => {
  it("retorna a rodada quando está liquidada", async () => {
    const roundRepository = new FakeRoundRepository();
    const round = Round.create({
      serverSeed: "seed",
      serverSeedHash: "hash",
      clientSeed: "client-fake",
      nonce: 0,
      crashPoint: 2.0,
      bettingWindowSeconds: 10,
    });
    round.startRunning();
    round.crash();
    round.settle();
    await roundRepository.save(round);

    const useCase = new VerifyRoundUseCase(roundRepository);
    const result = await useCase.execute(round.id);

    expect(result.id).toBe(round.id);
  });

  it("lança erro quando a rodada não existe", async () => {
    const roundRepository = new FakeRoundRepository();
    const useCase = new VerifyRoundUseCase(roundRepository);

    await expect(useCase.execute("non-existent")).rejects.toThrow(
      "Round not found",
    );
  });

  it("lança erro quando a rodada ainda não foi liquidada", async () => {
    const roundRepository = new FakeRoundRepository();
    const round = Round.create({
      serverSeed: "seed",
      serverSeedHash: "hash",
      clientSeed: "client-fake",
      nonce: 0,
      crashPoint: 2.0,
      bettingWindowSeconds: 10,
    });
    await roundRepository.save(round);

    const useCase = new VerifyRoundUseCase(roundRepository);

    await expect(useCase.execute(round.id)).rejects.toThrow(
      "Round is not finished yet, seed not revealed",
    );
  });
});
