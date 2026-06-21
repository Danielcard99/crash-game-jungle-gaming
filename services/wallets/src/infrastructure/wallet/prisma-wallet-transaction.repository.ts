import { Injectable } from "@nestjs/common";
import { type WalletTransactionRepository } from "../../domain/wallet/wallet-transaction.repository";
import { WalletTransactionType } from "../../domain/wallet/wallet-transaction-type.enum";
import { WalletTransaction } from "../../domain/wallet/wallet-transaction.aggregate";
import { PrismaService } from "../prisma/prisma.service";
import { WalletTransactionMapper } from "./wallet-transaction.mapper";

@Injectable()
export class PrismaWalletTransactionRepository implements WalletTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(transaction: WalletTransaction): Promise<void> {
    const data = WalletTransactionMapper.toPersistence(transaction);
    await this.prisma.walletTransaction.create({ data });
  }

  async findByBetIdAndType(
    betId: string,
    type: WalletTransactionType,
  ): Promise<WalletTransaction | null> {
    const transaction = await this.prisma.walletTransaction.findFirst({
      where: { betId, type },
    });

    if (!transaction) {
      return null;
    }

    return WalletTransactionMapper.toDomain(transaction);
  }
}
