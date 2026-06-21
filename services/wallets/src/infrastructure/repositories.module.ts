import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { WALLET_REPOSITORY } from "../domain/wallet/wallet.repository";
import { PrismaWalletRepository } from "./wallet/prisma-wallet.repository";
import { WALLET_TRANSACTION_REPOSITORY } from "../domain/wallet/wallet-transaction.repository";
import { PrismaWalletTransactionRepository } from "./wallet/prisma-wallet-transaction.repository";

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: WALLET_REPOSITORY, useClass: PrismaWalletRepository },
    {
      provide: WALLET_TRANSACTION_REPOSITORY,
      useClass: PrismaWalletTransactionRepository,
    },
  ],
  exports: [WALLET_REPOSITORY, WALLET_TRANSACTION_REPOSITORY],
})
export class RepositoriesModule {}
