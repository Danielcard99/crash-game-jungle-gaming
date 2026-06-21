import { RmqOptions, Transport } from "@nestjs/microservices";

export function getRabbitMqUrl(): string {
  const url = process.env.RABBITMQ_URL;

  if (!url) {
    throw new Error("RABBITMQ_URL environment variable is not defined");
  }

  return url;
}

export function createRabbitMQOptions(queue: string): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [getRabbitMqUrl()],
      queue,
      queueOptions: { durable: true },
    },
  };
}
