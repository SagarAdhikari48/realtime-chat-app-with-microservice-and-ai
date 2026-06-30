import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const startSendOtpConsumer = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.Rabbitmq_Host!,
      port: 5672,
      username: process.env.Rabbitmq_Username!,
      password: process.env.Rabbitmq_Password!,
    });

    const channel = await connection.createChannel();

    const queueName = "send-otp";

    await channel.assertQueue(queueName, { durable: true });
    console.log(
      "✅ Mail service consumer started , listining for the otp emails - Rabbitmq",
    );

    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const { to, subject, body } = JSON.parse(msg.content.toString());
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            auth: {
              user: process.env.EMAIL_USER!,
              pass: process.env.EMAIL_PASS!,
            },
          });

          await transporter.sendMail({
            from: "Chat app",
            to,
            subject,
            text: body,
          });

          console.log(`OTP send to ${to}`);
          channel.ack(msg);
        } catch (error) {
          console.log("Failed to send OTP", error);
          channel.ack(msg);
        }
      }
    });
  } catch (error) {
    console.log("Failed to start rabbitmq consumers", error);
  }
};
