import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { createRabbitMQOptions } from "@crash/rabbitmq-kit";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const rabbitMqUrl = process.env.RABBITMQ_URL;

  if (!rabbitMqUrl) {
    throw new Error("RABBITMQ_URL environment variable is not defined");
  }

  app.connectMicroservice<MicroserviceOptions>(
    createRabbitMQOptions("games_queue"),
  );

  await app.startAllMicroservices();

  const port = process.env.PORT;

  await app.listen(port, "0.0.0.0");

  console.log(`Games service running on port ${port}`);
}

bootstrap();
