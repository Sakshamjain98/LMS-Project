import { sendOtpService, verifyOtpService } from "./otp.service.js";
import User from "../../models/user.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { STATUS_CODES } from "../../constants/statusCode.js";
import { MESSAGES } from "../../constants/message.js";

export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await sendOtpService(email);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.OTP_SENT,
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, role } = req.body;
  await verifyOtpService(email, otp);
  let user = await User.findOne({ email });
  if (!user) {
    const isApproved = role === 'student';
    user = await User.create({
      email,
      name: email.split('@')[0],
      role,
      isApproved,
    });
  }
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.LOGIN_SUCCESS,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    },
  });
});