import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
const resendCtor = vi.fn();

class ResendMock {
  constructor(apiKey) {
    resendCtor(apiKey);
    this.emails = { send };
  }
}

vi.mock("resend", () => ({
  Resend: ResendMock,
}));

describe("email util", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.EMAIL_FROM;
    delete process.env.FRONTEND_URL;
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "PS Classes <noreply@psclasses.in>";
    send.mockResolvedValue({ data: { id: "email_123" }, error: null });
  });

  it("sends reset password emails through Resend", async () => {
    const { sendResetPasswordEmail } = await import(
      "../src/shared/utils/email.util.js"
    );

    await sendResetPasswordEmail("sakshamdevs007@gmail.com", "Student", "token123");

    expect(resendCtor).toHaveBeenCalledWith("re_test_key");
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "PS Classes <noreply@psclasses.in>",
        to: "sakshamdevs007@gmail.com",
        subject: "Password Reset",
        html: expect.stringContaining(
          "http://localhost:5173/reset-password?token=token123"
        ),
      })
    );
  });

  it("sends welcome emails through Resend", async () => {
    const { sendWelcomeEmail } = await import("../src/shared/utils/email.util.js");

    await sendWelcomeEmail("sakshamdevs007@gmail.com", "Student");

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "PS Classes <noreply@psclasses.in>",
        to: "sakshamdevs007@gmail.com",
        subject: "Welcome to LMS",
        html: expect.stringContaining("Welcome to LMS"),
      })
    );
  });
});