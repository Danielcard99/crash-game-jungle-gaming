import { describe, expect, it } from "bun:test";
import { ProcessBetPlacedUseCase } from "../../src/application/use-cases/process-bet-placed.use-case";
import { Wallet } from "../../src/domain/wallet/wallet.aggregate";
import { WalletTransaction } from "../../src/domain/wallet/wallet-transaction.aggregate";
import { WalletTransactionType } from "../../src/domain/wallet/wallet-transaction-type.enum";
import type { WalletRepository } from "../../src/domain/wallet/wallet.repository";
import type { WalletTransactionRepository } from "../../src/domain/wallet/wallet-transaction.repository";
import { Money } from "@crash/domain-kit";
import { BET_EVENTS, type EventPublisher } from "@crash/rabbitmq-kit";

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

class FakeClientProxy implements EventPublisher {
  public emittedEvents: { pattern: string; data: unknown }[] = [];

  emit(pattern: string, data: unknown) {
    this.emittedEvents.push({ pattern, data });
    return { subscribe: () => {} };
  }
}

describe("ProcessBetPlacedUseCase", () => {
  it("debita e publica bet.confirmed quando há saldo suficiente", async () => {
    const walletRepository = new FakeWalletRepository();
    const transactionRepository = new FakeWalletTransactionRepository();
    const client = new FakeClientProxy();

    const wallet = Wallet.create({ playerId: "player-1" });
    wallet.credit(Money.fromCents(5000n));
    await walletRepository.save(wallet);

    const useCase = new ProcessBetPlacedUseCase(
      walletRepository,
      transactionRepository,
      client,
    );

    await useCase.execute({
      betId: "bet-1",
      playerId: "player-1",
      amount: 1000,
    });

    const updated = await walletRepository.findByPlayerId("player-1");
    expect(updated?.balance.valueInCents).toBe(4000n);
    expect(client.emittedEvents[0].pattern).toBe(BET_EVENTS.CONFIRMED);
  });

  it("publica bet.rejected quando a carteira não existe", async () => {
    const walletRepository = new FakeWalletRepository();
    const transactionRepository = new FakeWalletTransactionRepository();
    const client = new FakeClientProxy();

    const useCase = new ProcessBetPlacedUseCase(
      walletRepository,
      transactionRepository,
      client,
    );

    await useCase.execute({
      betId: "bet-1",
      playerId: "non-existent",
      amount: 1000,
    });

    expect(client.emittedEvents[0].pattern).toBe(BET_EVENTS.REJECTED);
  });

  it("publica bet.rejected quando o saldo é insuficiente", async () => {
    const walletRepository = new FakeWalletRepository();
    const transactionRepository = new FakeWalletTransactionRepository();
    const client = new FakeClientProxy();

    const wallet = Wallet.create({ playerId: "player-1" });
    await walletRepository.save(wallet);

    const useCase = new ProcessBetPlacedUseCase(
      walletRepository,
      transactionRepository,
      client,
    );

    await useCase.execute({
      betId: "bet-1",
      playerId: "player-1",
      amount: 1000,
    });

    expect(client.emittedEvents[0].pattern).toBe(BET_EVENTS.REJECTED);
  });

  it("não processa de novo se já foi processado (idempotência)", async () => {
    const walletRepository = new FakeWalletRepository();
    const transactionRepository = new FakeWalletTransactionRepository();
    const client = new FakeClientProxy();

    const wallet = Wallet.create({ playerId: "player-1" });
    wallet.credit(Money.fromCents(5000n));
    await walletRepository.save(wallet);

    const existingTransaction = WalletTransaction.create({
      walletId: wallet.id,
      type: WalletTransactionType.DEBIT,
      amount: Money.fromCents(1000n),
      betId: "bet-1",
    });
    await transactionRepository.save(existingTransaction);

    const useCase = new ProcessBetPlacedUseCase(
      walletRepository,
      transactionRepository,
      client,
    );

    await useCase.execute({
      betId: "bet-1",
      playerId: "player-1",
      amount: 1000,
    });

    const updated = await walletRepository.findByPlayerId("player-1");
    expect(updated?.balance.valueInCents).toBe(5000n);
    expect(client.emittedEvents).toHaveLength(0);
  });
});
