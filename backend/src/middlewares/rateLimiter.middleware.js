import rateLimit from "express-rate-limit";

const createLimiter = ({
  windowMs,
  max,
  message,
  keyGenerator,
  standardHeaders = true,
  legacyHeaders = false,
  skip = () => false,
}) =>
  rateLimit({
    windowMs,
    max,
    message: { message },
    keyGenerator,
    standardHeaders,
    legacyHeaders,
    skip,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later.",
        retryAfter: req.rateLimit.resetTime,
      });
    },
  });

// Development mode skip function
const skipInDevelopment = () => process.env.NODE_ENV === "development";

export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests, please try again later.",
  skip: skipInDevelopment,
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased from 10 to 50 for development
  message: "Too many authentication attempts, please try again later.",
  skip: skipInDevelopment,
});

export const otpLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Increased from 3 to 5
  message: "Too many OTP requests, please wait before trying again.",
  skip: skipInDevelopment,
});

export const forgotPasswordLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Increased from 3 to 5
  keyGenerator: (req) => req.body?.email || req.ip,
  message: "Too many password reset attempts, please try again later.",
  skip: skipInDevelopment,
});