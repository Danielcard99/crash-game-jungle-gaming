import { Inject, Injectable } from "@nestjs/common";
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "../../domain/wallet/wallet.repository";
import {
  WALLET_TRANSACTION_REPOSITORY,
  type WalletTransactionRepository,
} from "../../domain/wallet/wallet-transaction.repository";
import { type BetWonEvent } from "@crash/rabbitmq-kit";
import { WalletTransactionType } from "../../domain/wallet/wallet-transaction-type.enum";
import { Money } from "@crash/domain-kit";
import { WalletTransaction } from "../../domain/wallet/wallet-transaction.aggregate";

@Injectable()
export class ProcessBetWonUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
    @Inject(WALLET_TRANSACTION_REPOSITORY)
    private readonly walletTransactionRepository: WalletTransactionRepository,
  ) {}

  async execute(data: BetWonEvent): Promise<void> {
    const alreadyProcessed =
      await this.walletTransactionRepository.findByBetIdAndType(
        data.betId,
        WalletTransactionType.CREDIT,
      );

    if (alreadyProcessed) {
      return;
    }

    const wallet = await this.walletRepository.findByPlayerId(data.playerId);

    if (!wallet) {
      return;
    }

    wallet.credit(Money.fromCents(BigInt(data.payout)));
    await this.walletRepository.save(wallet);

    const transaction = WalletTransaction.create({
      walletId: wallet.id,
      type: WalletTransactionType.CREDIT,
      amount: Money.fromCents(BigInt(data.payout)),
      betId: data.betId,
    });

    await this.walletTransactionRepository.save(transaction);
  }
}
