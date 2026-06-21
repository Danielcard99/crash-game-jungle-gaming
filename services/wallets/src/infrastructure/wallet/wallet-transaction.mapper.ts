import { Money } from "@crash/domain-kit";
import { WalletTransaction } from "../../domain/wallet/wallet-transaction.aggregate";
import type { WalletTransactionModel as PrismaWalletTransaction } from "../../../generated/prisma/models";
import { WalletTransactionType } from "../../domain/wallet/wallet-transaction-type.enum";

export class WalletTransactionMapper {
  static toPersistence(walletTransaction: WalletTransaction) {
    return {
      id: walletTransaction.id,
      walletId: walletTransaction.walletId,
      type: walletTransaction.type,
      amount: Number(walletTransaction.amount.valueInCents),
      betId: walletTransaction.betId,
      createdAt: walletTransaction.createdAt,
    };
  }

  static toDomain(raw: PrismaWalletTransaction): WalletTransaction {
    return WalletTransaction.reconstitute({
      id: raw.id,
      walletId: raw.walletId,
      type: raw.type as WalletTransactionType,
      amount: Money.fromCents(BigInt(raw.amount.toString())),
      betId: raw.betId,
      createdAt: raw.createdAt,
    });
  }
}
