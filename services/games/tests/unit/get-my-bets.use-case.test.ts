import { describe, expect, it } from "bun:test";
import { GetMyBetsUseCase } from "../../src/application/use-cases/get-my-bets.use-case";
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
    return (
      this.bets.find(
        (b) => b.playerId === playerId && b.status === BetStatus.ACTIVE,
      ) ?? null
    );
  }

  async findActiveBetsByRoundId(roundId: string): Promise<Bet[]> {
    return this.bets.filter(
      (b) => b.roundId === roundId && b.status === BetStatus.ACTIVE,
    );
  }

  async findAllByPlayerId(playerId: string): Promise<Bet[]> {
    return this.bets.filter((b) => b.playerId === playerId);
  }
}

describe("GetMyBetsUseCase", () => {
  it("retorna todas as apostas do jogador", async () => {
    const betRepository = new FakeBetRepository();

    const bet1 = Bet.create({
      roundId: "round-1",
      playerId: "player-1",
      playerUsername: "tester",
      amountBet: BetAmount.create(1000n),
      autoCashoutMultiplier: null,
    });
    const bet2 = Bet.create({
      roundId: "round-2",
      playerId: "player-1",
      playerUsername: "tester",
      amountBet: BetAmount.create(2000n),
      autoCashoutMultiplier: null,
    });
    const otherPlayerBet = Bet.create({
      roundId: "round-1",
      playerId: "player-2",
      playerUsername: "other",
      amountBet: BetAmount.create(500n),
      autoCashoutMultiplier: null,
    });

    await betRepository.save(bet1);
    await betRepository.save(bet2);
    await betRepository.save(otherPlayerBet);

    const useCase = new GetMyBetsUseCase(betRepository);
    const result = await useCase.execute("player-1");

    expect(result).toHaveLength(2);
    expect(result.every((b) => b.playerId === "player-1")).toBe(true);
  });

  it("retorna lista vazia quando o jogador não tem apostas", async () => {
    const betRepository = new FakeBetRepository();
    const useCase = new GetMyBetsUseCase(betRepository);

    const result = await useCase.execute("player-1");

    expect(result).toHaveLength(0);
  });
});
