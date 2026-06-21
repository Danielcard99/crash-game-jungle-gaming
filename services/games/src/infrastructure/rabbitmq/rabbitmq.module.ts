import { createRabbitMQOptions } from "@crash/rabbitmq-kit";
import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";

const rabbitMqUrl = process.env.RABBITMQ_URL;

if (!rabbitMqUrl) {
  throw new Error("RABBITMQ_URL environment variable is not defined");
}

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "WALLETS_CLIENT",
        ...createRabbitMQOptions("wallets_queue"),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitMQModule {}
