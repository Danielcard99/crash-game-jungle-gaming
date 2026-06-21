import { Module } from "@nestjs/common";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { RabbitMQModule } from "./infrastructure/rabbitmq/rabbitmq.module";
import { PrismaModule } from "./infrastructure/prisma/prisma.module";

@Module({
  controllers: [WalletsController],
  imports: [PrismaModule, RabbitMQModule],
})
export class AppModule {}
