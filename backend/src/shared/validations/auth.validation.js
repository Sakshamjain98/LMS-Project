import Joi from "joi";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]).{8,128}$/;

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const baseOptions = {
  abortEarly: false,
  stripUnknown: true,
  convert: true,
};

export const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required(),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(100)
    .required(),

  password: Joi.string()
    .pattern(passwordRegex)
    .min(8)
    .max(128)
    .required(),

  role: Joi.string()
    .valid("student", "teacher")
    .required(),
}).options(baseOptions);

export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(100)
    .required(),

  password: Joi.string()
    .min(8)
    .max(128)
    .required(),
}).options(baseOptions);

export const otpSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(100)
    .required(),
}).options(baseOptions);

export const verifyOtpSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(100)
    .required(),
  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .required(),
  role: Joi.string()
    .valid("student", "teacher")
    .required(),
}).options(baseOptions);

export const selectRoleSchema = Joi.object({
  role: Joi.string()
    .valid("student", "teacher")
    .required(),
}).options(baseOptions);

export const googleLoginSchema = Joi.object({
  token: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .required(),

  role: Joi.string()
    .valid("student", "teacher")
    .required(),
}).options(baseOptions);

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(100)
    .required(),
}).options(baseOptions);

export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .trim()
    .min(20)
    .max(500)
    .required(),

  password: Joi.string()
    .pattern(passwordRegex)
    .min(8)
    .max(128),

  newPassword: Joi.string()
    .pattern(passwordRegex)
    .min(8)
    .max(128),
}).or("password", "newPassword").options(baseOptions);