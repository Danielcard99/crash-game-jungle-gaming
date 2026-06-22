import { RoundStatus } from "./round-status.enum";

export class Round {
  private constructor(
    private readonly _id: string,
    private _status: RoundStatus,
    private readonly _serverSeed: string,
    private readonly _serverSeedHash: string,
    private readonly _clientSeed: string,
    private readonly _nonce: number,
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
    clientSeed: string;
    nonce: number;
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
      params.clientSeed,
      params.nonce,
      params.crashPoint,
      now,
      bettingEndsAt,
      null,
      null,
      null,
      now,
    );
  }

  static reconstitute(params: {
    id: string;
    status: RoundStatus;
    serverSeed: string;
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    crashPoint: number;
    bettingStartedAt: Date;
    bettingEndsAt: Date;
    startedAt: Date | null;
    crashedAt: Date | null;
    settledAt: Date | null;
    createdAt: Date;
  }) {
    return new Round(
      params.id,
      params.status,
      params.serverSeed,
      params.serverSeedHash,
      params.clientSeed,
      params.nonce,
      params.crashPoint,
      params.bettingStartedAt,
      params.bettingEndsAt,
      params.startedAt,
      params.crashedAt,
      params.settledAt,
      params.createdAt,
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

  get id() {
    return this._id;
  }

  get serverSeed() {
    return this._serverSeed;
  }

  get serverSeedHash() {
    return this._serverSeedHash;
  }

  get clientSeed() {
    return this._clientSeed;
  }

  get nonce() {
    return this._nonce;
  }

  get crashPoint() {
    return this._crashPoint;
  }

  get bettingStartedAt() {
    return this._bettingStartedAt;
  }

  get bettingEndsAt() {
    return this._bettingEndsAt;
  }

  get startedAt() {
    return this._startedAt;
  }

  get crashedAt() {
    return this._crashedAt;
  }

  get settledAt() {
    return this._settledAt;
  }

  get createdAt() {
    return this._createdAt;
  }
}
