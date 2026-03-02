import redis from "../../config/redis.js";
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
  const currentAttempts = await redis.get(rateKey);

  if (!currentAttempts) {
    await redis.set(rateKey, 1, {
      EX: OTP_LIMITS.WINDOW_MINUTES * 60,
    });
    return;
  }

  if (Number(currentAttempts) >= OTP_LIMITS.MAX_SEND_ATTEMPTS) {
    throw new ApiError(
      STATUS_CODES.TOO_MANY_REQUESTS,
      MESSAGES.OTP_RATE_LIMIT_EXCEEDED
    );
  }

  await redis.incr(rateKey);
};

export const sendOtpService = async (email) => {
  await checkAndUpdateRateLimit(email);

  const otp = generateOtp();
  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 10;
  const otpKey = getOtpKey(email);
  const attemptsKey = getAttemptsKey(email);

  await redis.del(otpKey);
  await redis.del(attemptsKey);

  await redis.set(otpKey, otp, {
    EX: expiryMinutes * 60,
  });

  await redis.set(attemptsKey, 0, {
    EX: expiryMinutes * 60,
  });

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

  const storedOtp = await redis.get(otpKey);

  if (!storedOtp) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      MESSAGES.INVALID_OTP
    );
  }

  const attempts = await redis.get(attemptsKey);

  if (attempts && Number(attempts) >= OTP_LIMITS.MAX_VERIFY_ATTEMPTS) {
    await redis.del(otpKey);
    await redis.del(attemptsKey);
    throw new ApiError(
      STATUS_CODES.TOO_MANY_REQUESTS,
      MESSAGES.OTP_VERIFY_LIMIT_EXCEEDED
    );
  }

  if (storedOtp !== inputOtp) {
    await redis.incr(attemptsKey);
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      MESSAGES.INVALID_OTP
    );
  }

  await redis.del(otpKey);
  await redis.del(attemptsKey);

  return {
    success: true,
    message: MESSAGES.OTP_VERIFIED,
  };
};


