import OtpRateLimit from "../../models/otpRateLimit.model.js";
import { OTP_LIMITS } from "../../constants/otp.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";

export const checkOtpSendLimit = async (email) => {
  const record = await OtpRateLimit.findOne({ email });
  const now = new Date();
  if (!record) {
    await OtpRateLimit.create({ email });
    return;
  }
  const diffMinutes =
    (now - record.lastAttemptAt) / (1000 * 60);
  if (diffMinutes > OTP_LIMITS.WINDOW_MINUTES) {
    record.attempts = 1;
    record.lastAttemptAt = now;
    await record.save();
    return;
  }
  if (record.attempts >= OTP_LIMITS.MAX_SEND_ATTEMPTS) {
    throw new ApiError(
      STATUS_CODES.TOO_MANY_REQUESTS,
      MESSAGES.OTP_RATE_LIMIT_EXCEEDED
    );
  }
  record.attempts += 1;
  record.lastAttemptAt = now;
  await record.save();
};
