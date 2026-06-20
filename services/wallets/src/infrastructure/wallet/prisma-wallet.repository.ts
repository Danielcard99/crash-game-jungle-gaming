import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WalletRepository } from "../../domain/wallet/wallet.repository";
import { Wallet } from "../../domain/wallet/wallet.aggregate";
import { WalletMapper } from "./wallet.mapper";

@Injectable()
export class PrismaWalletRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(wallet: Wallet): Promise<void> {
    const data = WalletMapper.toPersistence(wallet);

    await this.prisma.wallet.upsert({
      where: { id: wallet.id },
      create: data,
      update: {
        balance: data.balance,
        version: data.version,
      },
    });
  }

  async findById(id: string): Promise<Wallet | null> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id },
    });

    if (!wallet) {
      return null;
    }

    return WalletMapper.toDomain(wallet);
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { playerId },
    });

    if (!wallet) {
      return null;
    }

    return WalletMapper.toDomain(wallet);
  }
}
