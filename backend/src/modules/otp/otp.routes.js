import express from "express";
import { sendOtp, verifyOtp } from "./otp.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { otpSchema, verifyOtpSchema } from "../../shared/validations/auth.validation.js";
import { otpLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post("/send", otpLimiter, validate(otpSchema), sendOtp);
router.post("/verify", otpLimiter, validate(verifyOtpSchema), verifyOtp);

export default router;