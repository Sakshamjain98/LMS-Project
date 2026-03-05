import redisClient from "../../config/redis.js";
import { sendEmail } from "../../shared/utils/email.util.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { OTP_LIMITS } from "../../constants/otp.js";


const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const getOtpKey = (email) => `otp:${email}`;
const getAttemptsKey = (email) => `otp_attempts:${email}`;
const getRateLimitKey = (email) => `otp_rate:${email}`;

const checkAndUpdateRateLimit = async (email) => {
  const rateKey = getRateLimitKey(email);
  const currentAttempts = await redisClient.get(rateKey);

  if (!currentAttempts) {
    await redisClient.set(rateKey, 1);
    await redisClient.expire(rateKey, OTP_LIMITS.WINDOW_MINUTES * 60);
    return;
  }

  if (Number(currentAttempts) >= OTP_LIMITS.MAX_SEND_ATTEMPTS) {
    throw new ApiError(
      STATUS_CODES.TOO_MANY_REQUESTS,
      MESSAGES.OTP_RATE_LIMIT_EXCEEDED
    );
  }

  await redisClient.incr(rateKey);
};

export const sendOtpService = async (email) => {
  await checkAndUpdateRateLimit(email);

  const otp = generateOtp();
  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 10;

  const otpKey = getOtpKey(email);
  const attemptsKey = getAttemptsKey(email);

  await redisClient.del(otpKey);
  await redisClient.del(attemptsKey);

  await redisClient.set(otpKey, otp);
  await redisClient.expire(otpKey, expiryMinutes * 60);

  await redisClient.set(attemptsKey, 0);
  await redisClient.expire(attemptsKey, expiryMinutes * 60);

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. It expires in ${expiryMinutes} minutes.`,
  });

  return {
    success: true,
    message: MESSAGES.OTP_SENT,
  };
};

export const verifyOtpService = async (email, inputOtp) => {
  const otpKey = getOtpKey(email);
  const attemptsKey = getAttemptsKey(email);

  const storedOtp = await redisClient.get(otpKey);

  if (!storedOtp) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      MESSAGES.INVALID_OTP
    );
  }

  const attempts = await redisClient.get(attemptsKey);

  if (attempts && Number(attempts) >= OTP_LIMITS.MAX_VERIFY_ATTEMPTS) {
    await redisClient.del(otpKey);
    await redisClient.del(attemptsKey);
    throw new ApiError(
      STATUS_CODES.TOO_MANY_REQUESTS,
      MESSAGES.OTP_VERIFY_LIMIT_EXCEEDED
    );
  }

  if (storedOtp !== inputOtp) {
    await redisClient.incr(attemptsKey);
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      MESSAGES.INVALID_OTP
    );
  }

  await redisClient.del(otpKey);
  await redisClient.del(attemptsKey);

  return {
    success: true,
    message: MESSAGES.OTP_VERIFIED,
  };
};