import { ConflictException, Inject, Injectable } from "@nestjs/common";
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "../../domain/wallet/wallet.repository";
import { Wallet } from "../../domain/wallet/wallet.aggregate";

@Injectable()
export class CreateWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(params: { playerId: string }): Promise<Wallet> {
    const existing = await this.walletRepository.findByPlayerId(
      params.playerId,
    );

    if (existing) {
      throw new ConflictException("Wallet already exists for this player");
    }

    const wallet = Wallet.create({ playerId: params.playerId });
    await this.walletRepository.save(wallet);

    return wallet;
  }
}
