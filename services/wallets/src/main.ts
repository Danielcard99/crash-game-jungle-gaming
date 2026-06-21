import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MicroserviceOptions } from "@nestjs/microservices";
import { createRabbitMQOptions } from "@crash/rabbitmq-kit";
import { ZodValidationPipe } from "nestjs-zod";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const rabbitMqUrl = process.env.RABBITMQ_URL;

  if (!rabbitMqUrl) {
    throw new Error("RABBITMQ_URL environment variable is not defined");
  }

  app.connectMicroservice<MicroserviceOptions>(
    createRabbitMQOptions("wallets_queue"),
  );

  await app.startAllMicroservices();

  app.useGlobalPipes(new ZodValidationPipe());

  const port = process.env.PORT;
  await app.listen(port, "0.0.0.0");
  console.log(`Wallets service running on port ${port}`);
}

bootstrap();
