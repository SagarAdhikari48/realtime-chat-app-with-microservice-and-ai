import { json } from "express";
import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/tryCatch.js";
import { redisClient } from "../index.js";
import { User } from "../model/User.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";

export const loginUser = TryCatch(async (req, res) => {
  const { email: rawEmail } = req.body;
  const email = rawEmail?.trim().toLowerCase();
  if(!email){
    res.status(400).json({
      message: "Email is required",
    });
    return;
  }
  //Rate limit for a user can create single otp in one minutes using redis.
  const rateLimitKey = `otp:ratelimit:${email}`;
  const rateLimit = await redisClient.get(rateLimitKey);
  if (rateLimit) {
    res.status(429).json({
      message: "Too many request. Please wait before requesting new otp",
    });
    return;
  }
  // 6 digit otp means 1 -9 i.e 1 and 5zeros and 9 and 5 zeros below.
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpKey = `otp:${email}`;
  //expire till
  await redisClient.set(otpKey, otp, {
    EX: 300,
  });
  // set another otp
  await redisClient.set(rateLimitKey, "true", {
    EX: 60,
  });

  //   now send through rabbitmq mail service
  const message = {
    to: email,
    subject: "Your otp code",
    body: `Your OTP is ${otp}. It is valid for 5 minutes.`,
  };

  await publishToQueue("send-otp", message);

  res.status(200).json({
    message: "OTP sent to your email",
  });

});

export const verifyUser = TryCatch(async (req, res) => {
  const { email: rawEmail, otp: enteredOtp } = req.body;
  const email = rawEmail?.trim().toLowerCase();

  if (!email || !enteredOtp) {
    res.status(400).json({
      message: "Email and OTP are required!",
    });
    return;
  }

  const otpKey = `otp:${email}`;
  const storedOtp = await redisClient.get(otpKey);

  if (!storedOtp || storedOtp !== enteredOtp) {
    res.status(400).json({
      message: "Invalid or expired OTP",
    });
    return;
  }
  //if otp found then delete the otp from redis
  await redisClient.del(otpKey);

  let user = await User.findOne({ email });
  if (!user) {
    const name = email.slice(0, 8);
    user = await User.create({ name, email });
  }

  const token = generateToken(user);

  res.json({
    message: "User Verified",
    user,
    token,
  });
});

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(user);
});

export const updateName = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    res.status(404).json({
      message: "Please Login",
    });
    return;
  }
  user.name = req.body.name;
  await user.save();
  const token = generateToken(user);

  res.json({
    message: "User updated",
    user,
    token,
  });
});

export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res) => {
  const users = await User.find();
  res.json(users);
});

export const getAUser = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});
