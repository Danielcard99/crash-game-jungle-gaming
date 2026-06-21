import { Injectable } from "@nestjs/common";
import { BetRepository } from "../../domain/bet/bet.repository";
import { Bet } from "../../domain/bet/bet.aggregate";
import { BetMapper } from "./bet.mapper";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PrismaBetRepository implements BetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(bet: Bet): Promise<void> {
    const data = BetMapper.toPersistence(bet);

    await this.prisma.bet.upsert({
      where: { id: bet.id },
      create: data,
      update: {
        payout: data.payout,
        status: data.status,
        cashoutMultiplier: data.cashoutMultiplier,
        cashedOutAt: data.cashedOutAt,
      },
    });
  }
  async findById(id: string): Promise<Bet | null> {
    const bet = await this.prisma.bet.findUnique({
      where: { id },
    });

    if (!bet) {
      return null;
    }

    return BetMapper.toDomain(bet);
  }
}
