import { describe, expect, it } from "bun:test";
import { PlaceBetUseCase } from "../../src/application/use-cases/place-bet.use-case";
import { Round } from "../../src/domain/round/round.aggregate";
import { Bet } from "../../src/domain/bet/bet.aggregate";
import { BetAmount } from "../../src/domain/bet/bet-amount.value-object";
import { BetStatus } from "../../src/domain/bet/bet-status.enum";
import type { RoundRepository } from "../../src/domain/round/round.repository";
import type { BetRepository } from "../../src/domain/bet/bet.repository";
import { BET_EVENTS, type EventPublisher } from "@crash/rabbitmq-kit";

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
}

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
}

class FakeClientProxy implements EventPublisher {
  public emittedEvents: { pattern: string; data: unknown }[] = [];

  emit(pattern: string, data: unknown) {
    this.emittedEvents.push({ pattern, data });
    return { subscribe: () => {} };
  }
}

function createBettingRound(): Round {
  return Round.create({
    serverSeed: "seed",
    serverSeedHash: "hash",
    crashPoint: 2.0,
    bettingWindowSeconds: 10,
  });
}

describe("PlaceBetUseCase", () => {
  it("cria a aposta e publica bet.placed quando tudo é válido", async () => {
    const roundRepository = new FakeRoundRepository();
    const betRepository = new FakeBetRepository();
    const client = new FakeClientProxy();

    const round = createBettingRound();
    await roundRepository.save(round);

    const useCase = new PlaceBetUseCase(roundRepository, betRepository, client);

    const bet = await useCase.execute({
      roundId: round.id,
      playerId: "player-1",
      playerUsername: "tester",
      amountInCents: 1000n,
    });

    expect(bet.status).toBe(BetStatus.PENDING);
    expect(client.emittedEvents[0].pattern).toBe(BET_EVENTS.PLACED);
  });

  it("lança erro quando a rodada não existe", async () => {
    const roundRepository = new FakeRoundRepository();
    const betRepository = new FakeBetRepository();
    const client = new FakeClientProxy();

    const useCase = new PlaceBetUseCase(roundRepository, betRepository, client);

    await expect(
      useCase.execute({
        roundId: "non-existent",
        playerId: "player-1",
        playerUsername: "tester",
        amountInCents: 1000n,
      }),
    ).rejects.toThrow("Round not found");
  });

  it("lança erro quando a rodada não está em BETTING", async () => {
    const roundRepository = new FakeRoundRepository();
    const betRepository = new FakeBetRepository();
    const client = new FakeClientProxy();

    const round = createBettingRound();
    round.startRunning();
    await roundRepository.save(round);

    const useCase = new PlaceBetUseCase(roundRepository, betRepository, client);

    await expect(
      useCase.execute({
        roundId: round.id,
        playerId: "player-1",
        playerUsername: "tester",
        amountInCents: 1000n,
      }),
    ).rejects.toThrow("Round is not in betting phase");
  });

  it("lança erro quando o jogador já apostou na rodada", async () => {
    const roundRepository = new FakeRoundRepository();
    const betRepository = new FakeBetRepository();
    const client = new FakeClientProxy();

    const round = createBettingRound();
    await roundRepository.save(round);

    const existingBet = Bet.create({
      roundId: round.id,
      playerId: "player-1",
      playerUsername: "tester",
      amountBet: BetAmount.create(1000n),
    });
    await betRepository.save(existingBet);

    const useCase = new PlaceBetUseCase(roundRepository, betRepository, client);

    await expect(
      useCase.execute({
        roundId: round.id,
        playerId: "player-1",
        playerUsername: "tester",
        amountInCents: 1000n,
      }),
    ).rejects.toThrow("Player already placed a bet in this round");
  });
});
