import express from "express";
import { register, login, googleLogin } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { registerSchema, loginSchema, googleLoginSchema } from "../../shared/validations/auth.validation.js";
import { authLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/google", authLimiter, validate(googleLoginSchema), googleLogin);

export default router;