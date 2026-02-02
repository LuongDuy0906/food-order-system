import { registerAs } from "@nestjs/config";
import { RmqOptions, Transport } from "@nestjs/microservices";

export default registerAs('rabbitmq', (): RmqOptions => ({
    transport: Transport.RMQ,
    options: {
        urls: process.env.RABBITMQ_URL as any,
        queue: process.env.RABBITMQ_QUEUE,
        queueOptions: {
            durable: true
        },
    }
}))
