import { Wallet } from "../../domain/wallet/wallet.aggregate";
import type { WalletModel as PrismaWallet } from "../../../generated/prisma/models";
import { Money } from "@crash/domain-kit";

export class WalletMapper {
  static toPersistence(wallet: Wallet) {
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: Number(wallet.balance.valueInCents),
      version: wallet.version,
    };
  }

  static toDomain(raw: PrismaWallet): Wallet {
    return Wallet.reconstitute({
      id: raw.id,
      playerId: raw.playerId,
      balance: Money.fromCents(BigInt(raw.balance.toString())),
      version: raw.version,
    });
  }
}
