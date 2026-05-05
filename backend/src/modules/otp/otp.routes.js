import express from "express";
import { sendOtp, verifyOtp } from "./otp.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { otpSchema, verifyOtpSchema } from "../../shared/validations/auth.validation.js";

const router = express.Router();

router.post("/send", validate(otpSchema), sendOtp);
router.post("/verify", validate(verifyOtpSchema), verifyOtp);

export default router;
