import { describe, expect, it } from "bun:test";
import { ProcessBetWonUseCase } from "../../src/application/use-cases/process-bet-won.use-case";
import { Wallet } from "../../src/domain/wallet/wallet.aggregate";
import { WalletTransaction } from "../../src/domain/wallet/wallet-transaction.aggregate";
import { WalletTransactionType } from "../../src/domain/wallet/wallet-transaction-type.enum";
import type { WalletRepository } from "../../src/domain/wallet/wallet.repository";
import type { WalletTransactionRepository } from "../../src/domain/wallet/wallet-transaction.repository";
import { Money } from "@crash/domain-kit";

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

class FakeWalletTransactionRepository implements WalletTransactionRepository {
  private transactions: WalletTransaction[] = [];

  async save(transaction: WalletTransaction): Promise<void> {
    this.transactions.push(transaction);
  }

  async findByBetIdAndType(
    betId: string,
    type: WalletTransactionType,
  ): Promise<WalletTransaction | null> {
    return (
      this.transactions.find((t) => t.betId === betId && t.type === type) ??
      null
    );
  }
}

describe("ProcessBetWonUseCase", () => {
  it("credita a carteira quando ainda não foi processado", async () => {
    const walletRepository = new FakeWalletRepository();
    const transactionRepository = new FakeWalletTransactionRepository();

    const wallet = Wallet.create({ playerId: "player-1" });
    await walletRepository.save(wallet);

    const useCase = new ProcessBetWonUseCase(
      walletRepository,
      transactionRepository,
    );
    await useCase.execute({
      betId: "bet-1",
      playerId: "player-1",
      payout: 2000,
    });

    const updated = await walletRepository.findByPlayerId("player-1");
    expect(updated?.balance.valueInCents).toBe(2000n);
  });

  it("não credita de novo se já foi processado (idempotência)", async () => {
    const walletRepository = new FakeWalletRepository();
    const transactionRepository = new FakeWalletTransactionRepository();

    const wallet = Wallet.create({ playerId: "player-1" });
    await walletRepository.save(wallet);

    const existingTransaction = WalletTransaction.create({
      walletId: wallet.id,
      type: WalletTransactionType.CREDIT,
      amount: Money.fromCents(2000n),
      betId: "bet-1",
    });
    await transactionRepository.save(existingTransaction);

    const useCase = new ProcessBetWonUseCase(
      walletRepository,
      transactionRepository,
    );
    await useCase.execute({
      betId: "bet-1",
      playerId: "player-1",
      payout: 2000,
    });

    const updated = await walletRepository.findByPlayerId("player-1");
    expect(updated?.balance.valueInCents).toBe(0n);
  });

  it("não faz nada quando a carteira não existe", async () => {
    const walletRepository = new FakeWalletRepository();
    const transactionRepository = new FakeWalletTransactionRepository();
    const useCase = new ProcessBetWonUseCase(
      walletRepository,
      transactionRepository,
    );

    await expect(
      useCase.execute({
        betId: "bet-1",
        playerId: "non-existent",
        payout: 2000,
      }),
    ).resolves.toBeUndefined();
  });
});
