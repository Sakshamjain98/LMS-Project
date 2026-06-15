import { Resend } from "resend";
import { ApiError } from "../error/ApiError.js";
const getFromAddress = () =>
  process.env.EMAIL_FROM || "pharmacistshubhamsir@gmail.com";

const getFrontendUrl = () =>
  process.env.FRONTEND_URL || "http://localhost:5173";

const createResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new ApiError(500, "Email service is not configured. Set RESEND_API_KEY.");
  }

  return new Resend(apiKey);
};

const resend = createResendClient();

const sendResendEmail = async ({ to, subject, text, html }) => {
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });

  if (error) {
    throw new ApiError(503, `Failed to send email: ${error.message}`);
  }
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await sendResendEmail({ to, subject, text, html });
  } catch (error) {
    throw new ApiError(503, `Failed to send email: ${error.message}`);
  }
};

export const sendResetPasswordEmail = async (email, name, resetToken) => {
  const resetUrl = `${getFrontendUrl()}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h1>Password Reset Request</h1>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetUrl}" target="_blank" rel="noreferrer">Reset your password</a></p>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;
  const text = [
    "Password Reset Request",
    `Hello ${name},`,
    "You requested a password reset.",
    `Reset it here: ${resetUrl}`,
    "This link expires in 1 hour.",
    "If you did not request this, please ignore this email.",
  ].join("\n\n");

  try {
    await sendResendEmail({
      to: email,
      subject: "Password Reset",
      text,
      html,
    });
  } catch (error) {
    throw new ApiError(503, `Failed to send password reset email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h1>Welcome to LMS</h1>
      <p>Hello ${name},</p>
      <p>Your account has been created successfully. You can now sign in and get started.</p>
      <p>We're glad to have you with us.</p>
    </div>
  `;
  const text = [
    "Welcome to LMS",
    `Hello ${name},`,
    "Your account has been created successfully. You can now sign in and get started.",
    "We're glad to have you with us.",
  ].join("\n\n");

  try {
    await sendResendEmail({
      to: email,
      subject: "Welcome to LMS",
      text,
      html,
    });
  } catch (error) {
    throw new ApiError(503, `Failed to send welcome email: ${error.message}`);
  }
};