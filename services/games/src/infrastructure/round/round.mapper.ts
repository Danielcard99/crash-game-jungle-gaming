import { Round } from "../../domain/round/round.aggregate";
import { RoundStatus } from "../../domain/round/round-status.enum";
import type { RoundModel as PrismaRound } from "../../../generated/prisma/models";

export class RoundMapper {
  static toPersistence(round: Round) {
    return {
      id: round.id,
      status: round.status,
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      crashPoint: round.crashPoint,
      bettingStartedAt: round.bettingStartedAt,
      bettingEndsAt: round.bettingEndsAt,
      startedAt: round.startedAt,
      crashedAt: round.crashedAt,
      settledAt: round.settledAt,
      createdAt: round.createdAt,
    };
  }

  static toDomain(raw: PrismaRound): Round {
    return Round.reconstitute({
      id: raw.id,
      status: raw.status as RoundStatus,
      serverSeed: raw.serverSeed,
      serverSeedHash: raw.serverSeedHash,
      crashPoint: Number(raw.crashPoint),
      bettingStartedAt: raw.bettingStartedAt,
      bettingEndsAt: raw.bettingEndsAt,
      startedAt: raw.startedAt,
      crashedAt: raw.crashedAt,
      settledAt: raw.settledAt,
      createdAt: raw.createdAt,
    });
  }
}
