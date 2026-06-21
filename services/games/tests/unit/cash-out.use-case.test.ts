import { describe, expect, it } from "bun:test";
import { CashOutUseCase } from "../../src/application/use-cases/cash-out.use-case";
import { Bet } from "../../src/domain/bet/bet.aggregate";
import { BetAmount } from "../../src/domain/bet/bet-amount.value-object";
import { BetStatus } from "../../src/domain/bet/bet-status.enum";
import type { BetRepository } from "../../src/domain/bet/bet.repository";
import {
  BET_EVENTS,
  type BetWonEvent,
  type EventPublisher,
} from "@crash/rabbitmq-kit";

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
}

class FakeClientProxy implements EventPublisher {
  public emittedEvents: { pattern: string; data: unknown }[] = [];

  emit(pattern: string, data: unknown) {
    this.emittedEvents.push({ pattern, data });
    return { subscribe: () => {} };
  }
}

describe("CashOutUseCase", () => {
  it("saca a aposta e publica bet.won", async () => {
    const betRepository = new FakeBetRepository();
    const client = new FakeClientProxy();

    const bet = Bet.create({
      roundId: "round-1",
      playerId: "player-1",
      playerUsername: "tester",
      amountBet: BetAmount.create(1000n),
    });
    bet.confirm();
    await betRepository.save(bet);

    const useCase = new CashOutUseCase(betRepository, client);
    const result = await useCase.execute({
      playerId: "player-1",
      currentMultiplier: 2.5,
    });

    expect(result.status).toBe(BetStatus.CASHED_OUT);
    expect(client.emittedEvents[0].pattern).toBe(BET_EVENTS.WON);
    expect((client.emittedEvents[0].data as BetWonEvent).payout).toBe(2500);
  });

  it("lança erro quando não há aposta ativa pro jogador", async () => {
    const betRepository = new FakeBetRepository();
    const client = new FakeClientProxy();
    const useCase = new CashOutUseCase(betRepository, client);

    await expect(
      useCase.execute({ playerId: "player-1", currentMultiplier: 2.0 }),
    ).rejects.toThrow("No active bet found for this player");
  });
});
