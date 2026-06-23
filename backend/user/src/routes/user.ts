import express from "express";
import { loginUser } from "../controllers/user.js";

const router = express.Router();
console.log("User routes loaded");
router.post("/login", loginUser);

export default router;
