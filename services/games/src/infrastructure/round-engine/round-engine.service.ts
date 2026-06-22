import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";
import {
  BET_REPOSITORY,
  type BetRepository,
} from "../../domain/bet/bet.repository";
import { Round } from "../../domain/round/round.aggregate";
import {
  generateServerSeed,
  generateClientSeed,
  hashSeed,
  calculateCrashPoint,
} from "../../domain/provably-fair/provably-fair.service";
import { calculateCurrentMultiplier } from "../../domain/round/multiplier-calculator";
import { HandleRoundCrashUseCase } from "../../application/use-cases/handle-round-crash.use-case";
import { CashOutUseCase } from "../../application/use-cases/cash-out.use-case";

@Injectable()
export class RoundEngineService implements OnModuleInit {
  private readonly BETTING_WINDOW_SECONDS = 10;
  private readonly TICK_INTERVAL_MS = 100;
  private readonly HOUSE_EDGE_PERCENT = 1;
  private readonly NONCE = 0;

  constructor(
    @Inject(ROUND_REPOSITORY) private readonly roundRepository: RoundRepository,
    @Inject(BET_REPOSITORY) private readonly betRepository: BetRepository,
    private readonly handleRoundCrashUseCase: HandleRoundCrashUseCase,
    private readonly eventEmitter: EventEmitter2,
    private readonly cashOutUseCase: CashOutUseCase,
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
    const existingRound = await this.roundRepository.findCurrentBettingRound();

    let round: Round;

    if (existingRound) {
      round = existingRound;
    } else {
      const serverSeed = generateServerSeed();
      const serverSeedHash = hashSeed(serverSeed);
      const clientSeed = generateClientSeed();
      const crashPoint = calculateCrashPoint(
        serverSeed,
        this.NONCE,
        this.HOUSE_EDGE_PERCENT,
        clientSeed,
      );

      round = Round.create({
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce: this.NONCE,
        crashPoint,
        bettingWindowSeconds: this.BETTING_WINDOW_SECONDS,
      });

      await this.roundRepository.save(round);

      this.eventEmitter.emit("round.created", {
        roundId: round.id,
        serverSeedHash: round.serverSeedHash,
        bettingEndsAt: round.bettingEndsAt,
      });
    }

    const bettingEndsAt = round.bettingEndsAt!.getTime();
    const waitMs = Math.max(0, bettingEndsAt - Date.now());
    await this.wait(waitMs);

    round.startRunning();
    await this.roundRepository.save(round);

    this.eventEmitter.emit("round.started", { roundId: round.id });

    await this.runMultiplierLoop(round);
  }

  private async runMultiplierLoop(round: Round): Promise<void> {
    const startedAt = round.startedAt!.getTime();

    while (true) {
      const elapsed = (Date.now() - startedAt) / 1000;
      const currentMultiplier = calculateCurrentMultiplier(elapsed);

      if (currentMultiplier >= round.crashPoint) {
        await this.handleRoundCrashUseCase.execute(round);

        this.eventEmitter.emit("round.crashed", {
          roundId: round.id,
          crashPoint: round.crashPoint,
          serverSeed: round.serverSeed,
          serverSeedHash: round.serverSeedHash,
          clientSeed: round.clientSeed,
          nonce: round.nonce,
        });

        return;
      }

      // Verifica auto cashout para apostas ativas
      const activeBets = await this.betRepository.findActiveBetsByRoundId(
        round.id,
      );
      for (const bet of activeBets) {
        if (
          bet.autoCashoutMultiplier !== null &&
          currentMultiplier >= bet.autoCashoutMultiplier
        ) {
          try {
            await this.cashOutUseCase.execute({
              playerId: bet.playerId,
              currentMultiplier: bet.autoCashoutMultiplier,
            });

            this.eventEmitter.emit("bet.cashedOut", {
              roundId: round.id,
              playerUsername: bet.playerUsername,
              cashoutMultiplier: bet.autoCashoutMultiplier,
              payout: Number(
                bet.amountBet.toMoney().multiply(bet.autoCashoutMultiplier)
                  .valueInCents,
              ),
            });
          } catch {
            // aposta já foi sacada ou não existe mais — ignora
          }
        }
      }

      this.eventEmitter.emit("round.tick", {
        roundId: round.id,
        currentMultiplier,
      });

      await this.wait(this.TICK_INTERVAL_MS);
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
