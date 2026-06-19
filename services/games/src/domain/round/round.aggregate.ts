import { RoundStatus } from "./round-status.enum";

export class Round {
  private constructor(
    private readonly _id: string,
    private _status: RoundStatus,
    private readonly _serverSeed: string,
    private readonly _serverSeedHash: string,
    private readonly _crashPoint: number,
    private readonly _bettingStartedAt: Date,
    private readonly _bettingEndsAt: Date,
    private _startedAt: Date | null,
    private _crashedAt: Date | null,
    private _settledAt: Date | null,
    private readonly _createdAt: Date,
  ) {}

  static create(params: {
    serverSeed: string;
    serverSeedHash: string;
    crashPoint: number;
    bettingWindowSeconds: number;
  }) {
    const now = new Date();
    const bettingEndsAt = new Date(
      now.getTime() + params.bettingWindowSeconds * 1000,
    );

    return new Round(
      crypto.randomUUID(),
      RoundStatus.BETTING,
      params.serverSeed,
      params.serverSeedHash,
      params.crashPoint,
      now,
      bettingEndsAt,
      null,
      null,
      null,
      now,
    );
  }

  startRunning() {
    const initialStatus = this._status;
    const now = new Date();

    if (initialStatus !== RoundStatus.BETTING) {
      throw new Error("status must be BETTING to start running");
    }

    this._status = RoundStatus.RUNNING;
    this._startedAt = now;
  }

  crash() {
    const initialStatus = this._status;
    const now = new Date();

    if (initialStatus !== RoundStatus.RUNNING) {
      throw new Error("status must be RUNNING to crash");
    }

    this._status = RoundStatus.CRASHED;
    this._crashedAt = now;
  }

  settle() {
    const initialStatus = this._status;
    const now = new Date();

    if (initialStatus !== RoundStatus.CRASHED) {
      throw new Error("status must be CRASHED to settle");
    }

    this._status = RoundStatus.SETTLED;
    this._settledAt = now;
  }

  get status() {
    return this._status;
  }
}
