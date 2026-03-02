import rateLimit from "express-rate-limit";

const createLimiter = ({
  windowMs,
  max,
  message,
  keyGenerator,
  standardHeaders = true,
  legacyHeaders = false,
}) =>
  rateLimit({
    windowMs,
    max,
    message: { message },
    keyGenerator,
    standardHeaders,
    legacyHeaders,
  });

export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts, please try again later.",
});

export const otpLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 3,
  message: "Too many OTP requests, please wait before trying again.",
});

export const forgotPasswordLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body?.email || req.ip,
  message: "Too many password reset attempts, please try again later.",
});