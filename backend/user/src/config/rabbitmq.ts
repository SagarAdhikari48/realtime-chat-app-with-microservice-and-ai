import amqp from "amqplib";
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

export const publishToQueue = async (queueName: string, message: any) => {
  if (!channel) {
    console.log("Rabbitmq channel is not initialized!");
    return;
  }

  // Ensures the queue exists in RabbitMQ
  // If queue does not exist → it will be created
  // durable: true means:
  // Queue will survive RabbitMQ restart (data is saved)

  await channel.assertQueue(queueName, { durable: true });

  // Sends message into the queue
  // Step breakdown:
  // JSON.stringify(message) → converts object to string
  // Buffer.from(...) → converts string to binary format (required by RabbitMQ)
  // sendToQueue(...) → pushes message into the queue
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });

  //   persistent: true tells RabbitMQ:
  // “Save this message to disk so it won’t be lost if RabbitMQ crashes or restarts.”
};
