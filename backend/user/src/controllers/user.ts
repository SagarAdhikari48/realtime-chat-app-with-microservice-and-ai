import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/tryCatch.js";
import { redisClient } from "../index.js";

export const loginUser = TryCatch(async (req, res) => {
  const { email } = req.body;
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
