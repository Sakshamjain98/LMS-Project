import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('student', 'teacher').required(), 
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

export const otpSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  role: Joi.string().valid('student', 'teacher').required(),
});
export const selectRoleSchema = Joi.object({
  role: Joi.string().valid("student", "teacher").required(),
});

export const googleLoginSchema = Joi.object({
  token: Joi.string().required(),
  role: Joi.string().valid('student', 'teacher').required(),
});