import { describe, expect, it } from "bun:test";
import { HandleRoundCrashUseCase } from "../../src/application/use-cases/handle-round-crash.use-case";
import { Round } from "../../src/domain/round/round.aggregate";
import { Bet } from "../../src/domain/bet/bet.aggregate";
import { BetAmount } from "../../src/domain/bet/bet-amount.value-object";
import { BetStatus } from "../../src/domain/bet/bet-status.enum";
import { RoundStatus } from "../../src/domain/round/round-status.enum";
import type { RoundRepository } from "../../src/domain/round/round.repository";
import type { BetRepository } from "../../src/domain/bet/bet.repository";

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
}

function createRunningRound(): Round {
  const round = Round.create({
    serverSeed: "seed",
    serverSeedHash: "hash",
    crashPoint: 2.0,
    bettingWindowSeconds: 10,
  });
  round.startRunning();
  return round;
}

describe("HandleRoundCrashUseCase", () => {
  it("crasha a rodada, marca apostas ativas como LOST, e liquida a rodada", async () => {
    const roundRepository = new FakeRoundRepository();
    const betRepository = new FakeBetRepository();

    const round = createRunningRound();
    await roundRepository.save(round);

    const activeBet = Bet.create({
      roundId: round.id,
      playerId: "player-1",
      playerUsername: "tester",
      amountBet: BetAmount.create(1000n),
    });
    activeBet.confirm();
    await betRepository.save(activeBet);

    const useCase = new HandleRoundCrashUseCase(roundRepository, betRepository);
    await useCase.execute(round);

    expect(round.status).toBe(RoundStatus.SETTLED);

    const updatedBet = await betRepository.findById(activeBet.id);
    expect(updatedBet?.status).toBe(BetStatus.LOST);
  });

  it("não mexe em apostas que já foram sacadas (CASHED_OUT)", async () => {
    const roundRepository = new FakeRoundRepository();
    const betRepository = new FakeBetRepository();

    const round = createRunningRound();
    await roundRepository.save(round);

    const cashedOutBet = Bet.create({
      roundId: round.id,
      playerId: "player-2",
      playerUsername: "winner",
      amountBet: BetAmount.create(1000n),
    });
    cashedOutBet.confirm();
    cashedOutBet.cashOut(1.5);
    await betRepository.save(cashedOutBet);

    const useCase = new HandleRoundCrashUseCase(roundRepository, betRepository);
    await useCase.execute(round);

    const updatedBet = await betRepository.findById(cashedOutBet.id);
    expect(updatedBet?.status).toBe(BetStatus.CASHED_OUT);
  });
});
