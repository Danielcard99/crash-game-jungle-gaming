import { WalletTransactionType } from "./wallet-transaction-type.enum";
import { WalletTransaction } from "./wallet-transaction.aggregate";

export interface WalletTransactionRepository {
  save(transaction: WalletTransaction): Promise<void>;
  findByBetIdAndType(
    betId: string,
    type: WalletTransactionType,
  ): Promise<WalletTransaction | null>;
}
