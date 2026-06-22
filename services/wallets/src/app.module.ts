import { Module } from "@nestjs/common";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { RabbitMQModule } from "./infrastructure/rabbitmq/rabbitmq.module";
import { PrismaModule } from "./infrastructure/prisma/prisma.module";
import { RepositoriesModule } from "./infrastructure/repositories.module";
import { BetEventsController } from "./presentation/controllers/bet-events.controller";
import { ProcessBetWonUseCase } from "./application/use-cases/process-bet-won.use-case";
import { ProcessBetPlacedUseCase } from "./application/use-cases/process-bet-placed.use-case";
import { CreateWalletUseCase } from "./application/use-cases/create-wallet.use-case";
import { AuthModule } from "./infrastructure/auth/auth.module";
import { GetWalletUseCase } from "./application/use-cases/get-wallet.use-case";

@Module({
  controllers: [WalletsController, BetEventsController],
  imports: [PrismaModule, RabbitMQModule, RepositoriesModule, AuthModule],
  providers: [
    ProcessBetPlacedUseCase,
    ProcessBetWonUseCase,
    CreateWalletUseCase,
    GetWalletUseCase,
  ],
})
export class AppModule {}
