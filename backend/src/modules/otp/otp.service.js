import redisClient, { isRedisReady } from "../../config/redis.js";
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
const memoryOtpStore = new Map();

const getMemoryEntry = (key) => {
  const entry = memoryOtpStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    memoryOtpStore.delete(key);
    return null;
  }
  return entry.value;
};

const setMemoryEntry = (key, value, ttlSeconds = 0) => {
  const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
  memoryOtpStore.set(key, { value, expiresAt });
};

const delMemoryEntry = (key) => {
  memoryOtpStore.delete(key);
};

const checkAndUpdateRateLimit = async (email) => {
  const rateKey = getRateLimitKey(email);
  const currentAttempts = isRedisReady()
    ? await redisClient.get(rateKey)
    : getMemoryEntry(rateKey);

  if (!currentAttempts) {
    if (isRedisReady()) {
      await redisClient.set(rateKey, 1);
      await redisClient.expire(rateKey, OTP_LIMITS.WINDOW_MINUTES * 60);
    } else {
      setMemoryEntry(rateKey, 1, OTP_LIMITS.WINDOW_MINUTES * 60);
    }
    return;
  }

  if (Number(currentAttempts) >= OTP_LIMITS.MAX_SEND_ATTEMPTS) {
    throw new ApiError(
      STATUS_CODES.TOO_MANY_REQUESTS,
      MESSAGES.OTP_RATE_LIMIT_EXCEEDED
    );
  }

  if (isRedisReady()) {
    await redisClient.incr(rateKey);
  } else {
    setMemoryEntry(rateKey, Number(currentAttempts) + 1, OTP_LIMITS.WINDOW_MINUTES * 60);
  }
};

export const sendOtpService = async (email) => {
  await checkAndUpdateRateLimit(email);

  const otp = generateOtp();
  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 10;

  const otpKey = getOtpKey(email);
  const attemptsKey = getAttemptsKey(email);

  if (isRedisReady()) {
    await redisClient.del(otpKey);
    await redisClient.del(attemptsKey);
    await redisClient.set(otpKey, otp);
    await redisClient.expire(otpKey, expiryMinutes * 60);
    await redisClient.set(attemptsKey, 0);
    await redisClient.expire(attemptsKey, expiryMinutes * 60);
  } else {
    delMemoryEntry(otpKey);
    delMemoryEntry(attemptsKey);
    setMemoryEntry(otpKey, otp, expiryMinutes * 60);
    setMemoryEntry(attemptsKey, 0, expiryMinutes * 60);
  }

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

  const storedOtp = isRedisReady()
    ? await redisClient.get(otpKey)
    : getMemoryEntry(otpKey);

  if (!storedOtp) {
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      MESSAGES.INVALID_OTP
    );
  }

  const attempts = isRedisReady()
    ? await redisClient.get(attemptsKey)
    : getMemoryEntry(attemptsKey);

  if (attempts && Number(attempts) >= OTP_LIMITS.MAX_VERIFY_ATTEMPTS) {
    if (isRedisReady()) {
      await redisClient.del(otpKey);
      await redisClient.del(attemptsKey);
    } else {
      delMemoryEntry(otpKey);
      delMemoryEntry(attemptsKey);
    }
    throw new ApiError(
      STATUS_CODES.TOO_MANY_REQUESTS,
      MESSAGES.OTP_VERIFY_LIMIT_EXCEEDED
    );
  }

  if (storedOtp !== inputOtp) {
    if (isRedisReady()) {
      await redisClient.incr(attemptsKey);
    } else {
      setMemoryEntry(
        attemptsKey,
        Number(attempts || 0) + 1,
        Number(process.env.OTP_EXPIRY_MINUTES || 10) * 60
      );
    }
    throw new ApiError(
      STATUS_CODES.BAD_REQUEST,
      MESSAGES.INVALID_OTP
    );
  }

  if (isRedisReady()) {
    await redisClient.del(otpKey);
    await redisClient.del(attemptsKey);
  } else {
    delMemoryEntry(otpKey);
    delMemoryEntry(attemptsKey);
  }

  return {
    success: true,
    message: MESSAGES.OTP_VERIFIED,
  };
};