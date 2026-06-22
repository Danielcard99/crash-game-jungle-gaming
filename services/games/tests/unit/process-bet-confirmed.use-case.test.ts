import { describe, expect, it } from "bun:test";
import { ProcessBetConfirmedUseCase } from "../../src/application/use-cases/process-bet-confirmed.use-case";
import { Bet } from "../../src/domain/bet/bet.aggregate";
import { BetAmount } from "../../src/domain/bet/bet-amount.value-object";
import { BetStatus } from "../../src/domain/bet/bet-status.enum";
import type { BetRepository } from "../../src/domain/bet/bet.repository";

class FakeBetRepository implements BetRepository {
  private bets: Bet[] = [];

  async save(bet: Bet): Promise<void> {
    const index = this.bets.findIndex((b) => b.id === bet.id);
    if (index >= 0) this.bets[index] = bet;
    else this.bets.push(bet);
  }

  async findById(id: string): Promise<Bet | null> {
    return this.bets.find((b) => b.id === id) ?? null;
  }

  async findByRoundIdAndPlayerId(
    roundId: string,
    playerId: string,
  ): Promise<Bet | null> {
    return (
      this.bets.find((b) => b.roundId === roundId && b.playerId === playerId) ??
      null
    );
  }

  async findActiveBetByPlayerId(playerId: string): Promise<Bet | null> {
    return this.bets.find((b) => b.playerId === playerId && b.status === "ACTIVE" as any) ?? null;
  }

  async findActiveBetsByRoundId(roundId: string): Promise<Bet[]> {
    return this.bets.filter((b) => b.roundId === roundId && b.status === "ACTIVE" as any);
  }

  async findAllByPlayerId(playerId: string): Promise<Bet[]> {
    return this.bets.filter((b) => b.playerId === playerId);
  }
}

describe("ProcessBetConfirmedUseCase", () => {
  it("confirma a aposta quando ela existe", async () => {
    const repository = new FakeBetRepository();
    const bet = Bet.create({
      roundId: "round-1",
      playerId: "player-1",
      playerUsername: "tester",
      amountBet: BetAmount.create(1000n),
      autoCashoutMultiplier: null,
    });
    await repository.save(bet);

    const useCase = new ProcessBetConfirmedUseCase(repository);
    await useCase.execute({ betId: bet.id });

    const updated = await repository.findById(bet.id);
    expect(updated?.status).toBe(BetStatus.ACTIVE);
  });

  it("não faz nada quando a aposta não existe", async () => {
    const repository = new FakeBetRepository();
    const useCase = new ProcessBetConfirmedUseCase(repository);

    await expect(
      useCase.execute({ betId: "non-existent" }),
    ).resolves.toBeUndefined();
  });
});
