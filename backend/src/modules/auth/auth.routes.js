import express from "express";
import { register, login, googleLogin, forgotPassword, resetPassword } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../shared/validations/auth.validation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/google", validate(googleLoginSchema), googleLogin);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;
