import { sendOtpService, verifyOtpService } from "../services/otp.service.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { STATUS_CODES } from "../constants/statusCode.js";
import { MESSAGES } from "../constants/message.js";
export const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    await sendOtpService(email);
    res.status(STATUS_CODES.SUCCESS).json({
      message: MESSAGES.OTP_SENT,
    });
  } catch (err) {
    next(err);
  }
};
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    await verifyOtpService(email, otp);
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.status(STATUS_CODES.SUCCESS).json({
      message: MESSAGES.LOGIN_SUCCESS,
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};
