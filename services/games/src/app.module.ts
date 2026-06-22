import { Module } from "@nestjs/common";
import { GamesController } from "./presentation/controllers/games.controller";
import { RabbitMQModule } from "./infrastructure/rabbitmq/rabbitmq.module";
import { PrismaModule } from "./infrastructure/prisma/prisma.module";
import { RepositoriesModule } from "./infrastructure/repositories.module";
import { PlaceBetUseCase } from "./application/use-cases/place-bet.use-case";
import { CashOutUseCase } from "./application/use-cases/cash-out.use-case";
import { BetEventsController } from "./presentation/controllers/bet-events.controller";
import { ProcessBetConfirmedUseCase } from "./application/use-cases/process-bet-confirmed.use-case";
import { ProcessBetRejectedUseCase } from "./application/use-cases/process-bet-rejected.use-case";
import { AuthModule } from "./infrastructure/auth/auth.module";
import { RoundEngineService } from "./infrastructure/round-engine/round-engine.service";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { HandleRoundCrashUseCase } from "./application/use-cases/handle-round-crash.use-case";
import { GameGateway } from "./infrastructure/websocket/game.gateway";

@Module({
  controllers: [GamesController, BetEventsController],
  imports: [
    PrismaModule,
    RabbitMQModule,
    RepositoriesModule,
    AuthModule,
    EventEmitterModule.forRoot(),
  ],
  providers: [
    PlaceBetUseCase,
    CashOutUseCase,
    ProcessBetConfirmedUseCase,
    ProcessBetRejectedUseCase,
    RoundEngineService,
    HandleRoundCrashUseCase,
    GameGateway,
  ],
})
export class AppModule {}
