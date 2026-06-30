import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import chatRoutes from "./routes/chat.js";
import morgan from "morgan";
import cors from "cors";

dotenv.config();

connectDb();

const app = express();

const port = process.env.PORT!;

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use("/api/v1", chatRoutes);

app.listen(port, () => {
  console.log(`Server is running on the port ${port}`);
});
