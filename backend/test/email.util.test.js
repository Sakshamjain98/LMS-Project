import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));

vi.mock("nodemailer", () => ({
  default: { createTransport },
}));

describe("email util", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.EMAIL_USER = "notify@example.com";
    process.env.EMAIL_PASS = "app-password";
    delete process.env.EMAIL_HOST;
    delete process.env.EMAIL_PORT;
    delete process.env.EMAIL_SECURE;
    delete process.env.EMAIL_FROM;
    delete process.env.FRONTEND_URL;
  });

  it("uses explicit SMTP settings when EMAIL_HOST is missing", async () => {
    const { sendResetPasswordEmail } = await import(
      "../src/shared/utils/email.util.js"
    );

    await sendResetPasswordEmail("student@example.com", "Student", "token123");

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      auth: {
        user: "notify@example.com",
        pass: "app-password",
      },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "notify@example.com",
        to: "student@example.com",
        subject: "Password Reset",
        html: expect.stringContaining(
          "http://localhost:5173/reset-password?token=token123"
        ),
      })
    );
  });

  it("uses the configured SMTP host when EMAIL_HOST is present", async () => {
    process.env.EMAIL_HOST = "smtp.gmail.com";
    process.env.EMAIL_PORT = "587";
    process.env.EMAIL_SECURE = "false";

    const { sendEmail } = await import("../src/shared/utils/email.util.js");

    await sendEmail({
      to: "student@example.com",
      subject: "OTP code",
      text: "123456",
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      auth: {
        user: "notify@example.com",
        pass: "app-password",
      },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "notify@example.com",
        to: "student@example.com",
        subject: "OTP code",
        text: "123456",
      })
    );
  });
});