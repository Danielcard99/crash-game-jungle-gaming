import { Injectable, Inject } from "@nestjs/common";
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "../../domain/wallet/wallet.repository";
import { Money } from "@crash/domain-kit";
import { Wallet } from "../../domain/wallet/wallet.aggregate";

@Injectable()
export class SeedWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(playerId: string): Promise<void> {
    let wallet = await this.walletRepository.findByPlayerId(playerId);

    if (!wallet) {
      wallet = Wallet.create({ playerId });
    }

    wallet.credit(Money.fromCents(100_000n));
    await this.walletRepository.save(wallet);
  }
}
