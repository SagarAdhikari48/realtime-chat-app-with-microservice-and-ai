import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import cors from "cors";

import { createClient } from "redis";
import userRoutes from "./routes/user.js";
import { connectToRabbitMQ } from "./config/rabbitmq.js";

dotenv.config();

connectDb();

connectToRabbitMQ();

export const redisClient = createClient({
  url: process.env.REDIS_URL!,
});

const port = process.env.PORT;
console.log("PORT FROM ENV:", process.env.PORT);

redisClient
  .connect()
  .then(() => console.log("connected top redis"))
  .catch((error) => console.log(error));

const app = express();


app.get("/health", (req, res) => {
  console.log("Health endpoint hit");
  res.send("OK");
});
app.use(express.json());
app.use("/api/v1", userRoutes);
app.use(cors());

app.use((req, res, next) => {
  console.log("Incoming Request:", req.method, req.url);
  next();
});

app.listen(port, () => {
  console.log(`Server is running on the port ${port}`);
});

