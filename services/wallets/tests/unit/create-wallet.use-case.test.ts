import { describe, expect, it } from "bun:test";
import { WalletRepository } from "../../src/domain/wallet/wallet.repository";
import { Wallet } from "../../src/domain/wallet/wallet.aggregate";
import { CreateWalletUseCase } from "../../src/application/use-cases/create-wallet.use-case";

class FakeWalletRepository implements WalletRepository {
  private wallets: Wallet[] = [];

  async save(wallet: Wallet): Promise<void> {
    this.wallets.push(wallet);
  }

  async findById(id: string): Promise<Wallet | null> {
    return this.wallets.find((w) => w.id === id) ?? null;
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    return this.wallets.find((w) => w.playerId === playerId) ?? null;
  }
}

describe("CreateWalletUseCase", () => {
  it("cria uma carteira quando o jogador ainda não tem uma", async () => {
    const repository = new FakeWalletRepository();
    const useCase = new CreateWalletUseCase(repository);

    const wallet = await useCase.execute({ playerId: "player-1" });

    expect(wallet.playerId).toBe("player-1");
    expect(wallet.balance.valueInCents).toBe(0n);

    const saved = await repository.findByPlayerId("player-1");
    expect(saved).not.toBeNull();
  });

  it("lança erro quando o jogador já tem carteira", async () => {
    const repository = new FakeWalletRepository();
    const useCase = new CreateWalletUseCase(repository);

    await useCase.execute({ playerId: "player-1" });

    expect(useCase.execute({ playerId: "player-1" })).rejects.toThrow(
      "Wallet already exists for this player",
    );
  });
});
