import { Injectable, Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";

import { Money } from "@crash/domain-kit";
import {
  BET_EVENTS,
  type BetPlacedEvent,
  type BetConfirmedEvent,
  type BetRejectedEvent,
  BetRejectionReason,
} from "@crash/rabbitmq-kit";
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "../../domain/wallet/wallet.repository";
import {
  WALLET_TRANSACTION_REPOSITORY,
  type WalletTransactionRepository,
} from "../../domain/wallet/wallet-transaction.repository";
import { WalletTransactionType } from "../../domain/wallet/wallet-transaction-type.enum";
import { WalletTransaction } from "../../domain/wallet/wallet-transaction.aggregate";

@Injectable()
export class ProcessBetPlacedUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
    @Inject(WALLET_TRANSACTION_REPOSITORY)
    private readonly walletTransactionRepository: WalletTransactionRepository,
    @Inject("GAMES_CLIENT") private readonly gamesClient: ClientProxy,
  ) {}

  async execute(data: BetPlacedEvent): Promise<void> {
    const alreadyProcessed =
      await this.walletTransactionRepository.findByBetIdAndType(
        data.betId,
        WalletTransactionType.DEBIT,
      );

    if (alreadyProcessed) {
      return;
    }

    const wallet = await this.walletRepository.findByPlayerId(data.playerId);

    if (!wallet) {
      this.reject(data.betId);
      return;
    }

    try {
      wallet.debit(Money.fromCents(BigInt(data.amount)));
    } catch {
      this.reject(data.betId);
      return;
    }

    await this.walletRepository.save(wallet);

    const transaction = WalletTransaction.create({
      walletId: wallet.id,
      type: WalletTransactionType.DEBIT,
      amount: Money.fromCents(BigInt(data.amount)),
      betId: data.betId,
    });

    await this.walletTransactionRepository.save(transaction);

    const confirmed: BetConfirmedEvent = { betId: data.betId };
    this.gamesClient.emit(BET_EVENTS.CONFIRMED, confirmed);
  }

  private reject(betId: string): void {
    const rejected: BetRejectedEvent = {
      betId,
      reason: BetRejectionReason.INSUFFICIENT_BALANCE,
    };
    this.gamesClient.emit(BET_EVENTS.REJECTED, rejected);
  }
}
