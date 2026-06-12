import nodemailer from "nodemailer";
import { ApiError } from "../error/ApiError.js";
const getFromAddress = () =>
  process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@example.com";

const getFrontendUrl = () =>
  process.env.FRONTEND_URL || "http://localhost:5173";

const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
  const emailPort = Number(process.env.EMAIL_PORT || 587);
  const emailSecure = process.env.EMAIL_SECURE === "true";
  const connectionTimeout = Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || 10000);
  const greetingTimeout = Number(process.env.EMAIL_GREETING_TIMEOUT_MS || 10000);
  const socketTimeout = Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || 10000);

  if (!emailUser || !emailPass) {
    throw new ApiError(
      500,
      "Email service is not configured. Set EMAIL_USER and EMAIL_PASS."
    );
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: emailSecure,
    requireTLS: !emailSecure,
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    auth: { user: emailUser, pass: emailPass },
  });
};

const transporter = createTransporter();

export const sendEmail = async ({ to, subject, text }) => {
  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
    });
  } catch (error) {
    throw new ApiError(503, `Failed to send email: ${error.message}`);
  }
};

export const sendResetPasswordEmail = async (email, name, resetToken) => {
  const resetUrl = `${getFrontendUrl()}/reset-password?token=${resetToken}`;
  const message = `
    <h1>Password Reset Request</h1>
    <p>Hello ${name},</p>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}" target="_blank">${resetUrl}</a>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject: "Password Reset",
      html: message,
    });
  } catch (error) {
    throw new ApiError(503, `Failed to send password reset email: ${error.message}`);
  }
};