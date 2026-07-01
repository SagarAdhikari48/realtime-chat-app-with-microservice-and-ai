import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import { error } from "console";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const userSocketMap: Record<string, string> = {};

io.on("connection", (socket: Socket) => {
  console.log("User connected", socket.id);

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });

  socket.on("connect_error", () => {
    console.log("Socket Connection Error", error);
  });
});

export { app, server, io };
