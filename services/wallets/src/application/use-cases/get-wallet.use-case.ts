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
    const wallet = await this.walletRepository.findByPlayerId(playerId);

    if (!wallet) {
      throw new NotFoundException("Wallet not found");
    }

    return wallet;
  }
}
