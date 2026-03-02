export const MESSAGES = Object.freeze({
  SUCCESS: "Success",
  SOMETHING_WENT_WRONG: "Something went wrong",
  INTERNAL_SERVER_ERROR: "Internal server error",

  USER_CREATED: "User created successfully",
  LOGIN_SUCCESS: "Login successful",
  INVALID_CREDENTIALS: "Invalid email or password",
  UNAUTHORIZED: "Unauthorized access",
  TOKEN_MISSING: "Authorization token is missing",
  TOKEN_INVALID: "Invalid or expired token",
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User already exists",

  ROLE_REQUIRED: "Role selection is required",
  ROLE_ALREADY_ASSIGNED: "Role already assigned",
  INVALID_ROLE: "Invalid role selected",
  ACCESS_DENIED: "You do not have permission to access this resource",

  OTP_SENT: "OTP sent successfully",
  INVALID_OTP: "Invalid OTP",
  OTP_EXPIRED: "OTP expired",
  OTP_RATE_LIMIT_EXCEEDED: "Too many OTP requests. Try again later.",
  OTP_VERIFY_LIMIT_EXCEEDED: "Too many incorrect OTP attempts",

  PROFILE_UPDATED: "Profile updated successfully",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Access denied",

  PAYMENT_INITIATED: "Payment initiated",
  PAYMENT_SUCCESS: "Payment verified successfully",
  INVALID_PAYMENT: "Invalid payment",
  SUBSCRIPTION_REQUIRED: "Active subscription required",

  FORGOT_PASSWORD_EMAIL_SENT:
    "If an account with that email exists, a password reset link has been sent.",
  PASSWORD_RESET_SUCCESS: "Password has been reset successfully.",
});
