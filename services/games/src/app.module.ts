import { Module } from "@nestjs/common";
import { GamesController } from "./presentation/controllers/games.controller";
import { RabbitMQModule } from "./infrastructure/rabbitmq/rabbitmq.module";
import { PrismaModule } from "./infrastructure/prisma/prisma.module";

@Module({
  controllers: [GamesController],
  imports: [PrismaModule, RabbitMQModule],
})
export class AppModule {}
