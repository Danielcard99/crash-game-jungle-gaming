import { Wallet } from "./wallet.aggregate";

export const WALLET_REPOSITORY = Symbol("WalletRepository");

export interface WalletRepository {
  save(wallet: Wallet): Promise<void>;
  findById(id: string): Promise<Wallet | null>;
  findByPlayerId(playerId: string): Promise<Wallet | null>;
}
