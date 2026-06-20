import { Money } from "../shared/money.value-object";
import { BetAmount } from "./bet-amount.value-object";
import { BetStatus } from "./bet-status.enum";

export class Bet {
  private constructor(
    private readonly _id: string,
    private readonly _roundId: string,
    private readonly _playerId: string,
    private readonly _playerUsername: string,
    private readonly _amountBet: BetAmount,
    private _status: BetStatus,
    private _cashoutMultiplier: number | null,
    private _payout: Money | null,
    private readonly _placedAt: Date,
    private _cashedOutAt: Date | null,
  ) {}

  static create(params: {
    roundId: string;
    playerId: string;
    playerUsername: string;
    amountBet: BetAmount;
  }) {
    const now = new Date();

    return new Bet(
      crypto.randomUUID(),
      params.roundId,
      params.playerId,
      params.playerUsername,
      params.amountBet,
      BetStatus.PENDING,
      null,
      null,
      now,
      null,
    );
  }

  confirm() {
    const status = this._status;

    if (status !== BetStatus.PENDING) {
      throw new Error("Only bets in PENDING status can be confirmed");
    }

    this._status = BetStatus.ACTIVE;
  }

  reject() {
    const status = this._status;

    if (status !== BetStatus.PENDING) {
      throw new Error("Only bets in PENDING status can be rejected");
    }

    this._status = BetStatus.REJECTED;
  }

  cashOut(multiplier: number) {
    const status = this._status;
    const now = new Date();

    if (status !== BetStatus.ACTIVE) {
      throw new Error("Only bets in ACTIVE status can be cashed out");
    }

    const payoutMultiplied = this._amountBet.toMoney().multiply(multiplier);

    this._cashoutMultiplier = multiplier;
    this._payout = payoutMultiplied;
    this._status = BetStatus.CASHED_OUT;
    this._cashedOutAt = now;
  }

  markAsLost() {
    const status = this._status;

    if (status !== BetStatus.ACTIVE) {
      throw new Error("Only bets in ACTIVE status can be marked as lost");
    }

    this._status = BetStatus.LOST;
  }

  get status() {
    return this._status;
  }

  get amountBet() {
    return this._amountBet;
  }

  get cashoutMultiplier() {
    return this._cashoutMultiplier;
  }

  get payout() {
    return this._payout;
  }
}
