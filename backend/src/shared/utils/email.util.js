import { Resend } from "resend";
import { ApiError } from "../error/ApiError.js";
const getFromAddress = () =>
  process.env.EMAIL_FROM || "noreply@psclasses.in";

const getBrandUrl = () => process.env.BRAND_SITE_URL || "https://psclasses.in";

const getLogoUrl = () =>
  process.env.EMAIL_LOGO_URL ||
  "https://www.psclasses.in/assets/logo-DHy9Va5o.png";

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
  console.info("[mail] sending email", {
    to,
    subject,
    from: getFromAddress(),
  });

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });

  if (error) {
    console.error("[mail] resend rejected email", {
      to,
      subject,
      from: getFromAddress(),
      error: error.message,
    });
    throw new ApiError(503, `Failed to send email: ${error.message}`);
  }

  console.info("[mail] email sent", {
    to,
    subject,
    from: getFromAddress(),
  });
};

const createEmailShell = ({ title, intro, content, ctaText, ctaUrl }) => `
  <div style="margin:0;background:#f4f7f5;padding:24px 0;">
    <div style="max-width:640px;margin:0 auto;padding:0 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="background:linear-gradient(135deg,#0f766e 0%,#16a34a 100%);border-radius:24px 24px 0 0;padding:28px 28px 24px;text-align:center;">
        <img src="${getLogoUrl()}" alt="PS Classes" style="width:120px;max-width:100%;height:auto;display:block;margin:0 auto 16px;" />
        <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:700;">PS Classes</p>
      </div>
      <div style="background:#ffffff;border:1px solid #d9e4dd;border-top:none;border-radius:0 0 24px 24px;padding:32px 28px 28px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
        <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#0f172a;">${title}</h1>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#334155;">${intro}</p>
        <div style="font-size:15px;line-height:1.75;color:#1e293b;">${content}</div>
        ${ctaUrl ? `
          <div style="margin:28px 0 10px;">
            <a href="${ctaUrl}" target="_blank" rel="noreferrer" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">${ctaText}</a>
          </div>
          <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#64748b;word-break:break-word;">${ctaUrl}</p>
        ` : ""}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 18px;" />
        <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">If you did not request this, you can safely ignore this email.</p>
      </div>
    </div>
  </div>
`;

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await sendResendEmail({ to, subject, text, html });
  } catch (error) {
    throw new ApiError(503, `Failed to send email: ${error.message}`);
  }
};

export const sendResetPasswordEmail = async (email, name, resetToken) => {
  const resetUrl = `${getFrontendUrl()}/reset-password?token=${resetToken}`;
  const html = createEmailShell({
    title: "Reset your password",
    intro: `Hello ${name}, you requested a password reset for your PS Classes account.`,
    content: `
      <p style="margin:0 0 14px;">Use the button below to create a new password. The link expires in 1 hour for security.</p>
    `,
    ctaText: "Reset password",
    ctaUrl: resetUrl,
  });
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
  const html = createEmailShell({
    title: "Welcome to PS Classes",
    intro: `Hello ${name}, your account is ready.`,
    content: `
      <p style="margin:0 0 14px;">You can now sign in, explore the platform, and continue your preparation with PS Classes.</p>
      <p style="margin:0;">We are glad to have you with us.</p>
    `,
    ctaText: "Start learning",
    ctaUrl: getBrandUrl(),
  });
  const text = [
    "Welcome to PS Classes",
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