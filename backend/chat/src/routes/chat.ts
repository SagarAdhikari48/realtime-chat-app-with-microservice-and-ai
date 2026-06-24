import express from "express";
import { createNewChat } from "../cntrollers/chat.js";
import isAuth from "../middlewares/isAuth.js";
const router = express.Router();


router.post("/chat/new", isAuth, createNewChat);

export default router;
