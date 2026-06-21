import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";
import { Round } from "../../domain/round/round.aggregate";
import {
  generateServerSeed,
  hashSeed,
  calculateCrashPoint,
} from "../../domain/provably-fair/provably-fair.service";
import { calculateCurrentMultiplier } from "../../domain/round/multiplier-calculator";
import { HandleRoundCrashUseCase } from "../../application/use-cases/handle-round-crash.use-case";

@Injectable()
export class RoundEngineService implements OnModuleInit {
  private readonly BETTING_WINDOW_SECONDS = 10;
  private readonly TICK_INTERVAL_MS = 100;
  private readonly HOUSE_EDGE_PERCENT = 1;
  private readonly NONCE = 0;

  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    private readonly handleRoundCrashUseCase: HandleRoundCrashUseCase,
  ) {}

  onModuleInit() {
    this.runCycle();
  }

  private async runCycle(): Promise<void> {
    try {
      await this.startNewRound();
    } catch (error) {
      console.error("Round engine error:", error);
    }
    setTimeout(() => this.runCycle(), 1000);
  }

  private async startNewRound(): Promise<void> {
    const serverSeed = generateServerSeed();
    const serverSeedHash = hashSeed(serverSeed);
    const crashPoint = calculateCrashPoint(
      serverSeed,
      this.NONCE,
      this.HOUSE_EDGE_PERCENT,
    );

    const round = Round.create({
      serverSeed,
      serverSeedHash,
      crashPoint,
      bettingWindowSeconds: this.BETTING_WINDOW_SECONDS,
    });

    await this.roundRepository.save(round);
    await this.wait(this.BETTING_WINDOW_SECONDS * 1000);

    round.startRunning();
    await this.roundRepository.save(round);

    await this.runMultiplierLoop(round);
  }

  private async runMultiplierLoop(round: Round): Promise<void> {
    const startedAt = round.startedAt!.getTime();

    while (true) {
      const elapsed = (Date.now() - startedAt) / 1000;
      const currentMultiplier = calculateCurrentMultiplier(elapsed);

      if (currentMultiplier >= round.crashPoint) {
        await this.handleRoundCrashUseCase.execute(round);
        return;
      }

      await this.wait(this.TICK_INTERVAL_MS);
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
