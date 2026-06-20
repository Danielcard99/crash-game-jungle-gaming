import { Bet } from "../../domain/bet/bet.aggregate";
import type { BetModel as PrismaBet } from "../../../generated/prisma/models";
import { BetAmount } from "../../domain/bet/bet-amount.value-object";
import { BetStatus } from "../../domain/bet/bet-status.enum";
import { Money } from "@crash/domain-kit";

export class BetMapper {
  static toPersistence(bet: Bet) {
    return {
      id: bet.id,
      roundId: bet.roundId,
      playerId: bet.playerId,
      playerUsername: bet.playerUsername,
      amountBet: Number(bet.amountBet.valueInCents),
      status: bet.status,
      cashoutMultiplier: bet.cashoutMultiplier,
      payout: bet.payout ? Number(bet.payout.valueInCents) : null,
      placedAt: bet.placedAt,
      cashedOutAt: bet.cashedOutAt,
    };
  }

  static toDomain(raw: PrismaBet): Bet {
    return Bet.reconstitute({
      id: raw.id,
      roundId: raw.roundId,
      playerId: raw.playerId,
      playerUsername: raw.playerUsername,
      amountBet: BetAmount.create(BigInt(raw.amountBet.toString())),
      status: raw.status as BetStatus,
      cashoutMultiplier: raw.cashoutMultiplier
        ? Number(raw.cashoutMultiplier)
        : null,
      payout: raw.payout
        ? Money.fromCents(BigInt(raw.payout.toString()))
        : null,
      placedAt: raw.placedAt,
      cashedOutAt: raw.cashedOutAt,
    });
  }
}
