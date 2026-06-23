import amqp from "amqplib";
import type { Connection, Channel } from "amqplib";

let channel: amqp.Channel;

export const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.Rabbitmq_Host!,
      port: 5672,
      username: process.env.Rabbitmq_Username!,
      password: process.env.Rabbitmq_Password!,
    });

    channel = await connection.createChannel();
    
    console.log("✅ connected to rabbitmq");

  } catch (error) {
    console.log("Failed to connect to rabbitmq", error);
  }
};
