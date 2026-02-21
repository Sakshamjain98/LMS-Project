import Otp from "../../models/otp.model.js";
import { sendEmail } from "../../shared/utils/email.util.js";
import { ApiError } from "../../shared/error/ApiError.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";
import { checkOtpSendLimit } from "../user/otpRateLimit.service.js";
import { OTP_LIMITS } from "../../constants/otp.js";

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtpService = async (email) => {
  await checkOtpSendLimit(email);
  const otp = generateOtp();
  const expiresAt = new Date(
    Date.now() + (process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000
  );
  await Otp.deleteMany({ email });
  await Otp.create({ email, otp, expiresAt });
  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
  });
};

export const verifyOtpService = async (email, inputOtp) => {
  const record = await Otp.findOne({ email });
  if (!record) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, MESSAGES.INVALID_OTP);
  }
  if (record.expiresAt < new Date()) {
    await Otp.deleteMany({ email });
    throw new ApiError(STATUS_CODES.BAD_REQUEST, MESSAGES.OTP_EXPIRED);
  }
  if (record.attempts >= OTP_LIMITS.MAX_VERIFY_ATTEMPTS) {
    throw new ApiError(
      STATUS_CODES.TOO_MANY_REQUESTS,
      MESSAGES.OTP_VERIFY_LIMIT_EXCEEDED
    );
  }
  if (record.otp !== inputOtp) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(STATUS_CODES.BAD_REQUEST, MESSAGES.INVALID_OTP);
  }
  await Otp.deleteMany({ email });
  return { success: true };
};