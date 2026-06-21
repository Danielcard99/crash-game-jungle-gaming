import { Injectable } from "@nestjs/common";
import { RoundRepository } from "../../domain/round/round.repository";
import { PrismaService } from "../prisma/prisma.service";
import { Round } from "../../domain/round/round.aggregate";
import { RoundMapper } from "./round.mapper";

@Injectable()
export class PrismaRoundRepository implements RoundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(round: Round): Promise<void> {
    const data = RoundMapper.toPersistence(round);

    await this.prisma.round.upsert({
      where: { id: round.id },
      create: data,
      update: {
        status: data.status,
        startedAt: data.startedAt,
        crashedAt: data.crashedAt,
        settledAt: data.settledAt,
      },
    });
  }

  async findById(id: string): Promise<Round | null> {
    const round = await this.prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return null;
    }

    return RoundMapper.toDomain(round);
  }
}
