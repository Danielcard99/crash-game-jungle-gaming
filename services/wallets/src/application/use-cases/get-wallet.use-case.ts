import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "../../domain/wallet/wallet.repository";
import { Wallet } from "../../domain/wallet/wallet.aggregate";

@Injectable()
export class GetWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(playerId: string): Promise<Wallet> {
    const existing = await this.walletRepository.findByPlayerId(playerId);

    if (existing) {
      return existing;
    }

    const wallet = Wallet.create({ playerId });
    await this.walletRepository.save(wallet);

    return wallet;
  }
}
