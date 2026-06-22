import { describe, expect, it } from "bun:test";
import { GetWalletUseCase } from "../../src/application/use-cases/get-wallet.use-case";
import { Wallet } from "../../src/domain/wallet/wallet.aggregate";
import type { WalletRepository } from "../../src/domain/wallet/wallet.repository";

class FakeWalletRepository implements WalletRepository {
  private wallets: Wallet[] = [];

  async save(wallet: Wallet): Promise<void> {
    const index = this.wallets.findIndex((w) => w.id === wallet.id);
    if (index >= 0) this.wallets[index] = wallet;
    else this.wallets.push(wallet);
  }

  async findById(id: string): Promise<Wallet | null> {
    return this.wallets.find((w) => w.id === id) ?? null;
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    return this.wallets.find((w) => w.playerId === playerId) ?? null;
  }
}

describe("GetWalletUseCase", () => {
  it("retorna a carteira do jogador quando existe", async () => {
    const walletRepository = new FakeWalletRepository();
    const wallet = Wallet.create({ playerId: "player-1" });
    await walletRepository.save(wallet);

    const useCase = new GetWalletUseCase(walletRepository);
    const result = await useCase.execute("player-1");

    expect(result.playerId).toBe("player-1");
  });

  it("lança erro quando o jogador não tem carteira", async () => {
    const walletRepository = new FakeWalletRepository();
    const useCase = new GetWalletUseCase(walletRepository);

    await expect(useCase.execute("player-1")).rejects.toThrow(
      "Wallet not found",
    );
  });
});
