import { beforeEach, describe, expect, it, vi } from "vitest";

const { findOne, select, generateToken } = vi.hoisted(() => ({
  findOne: vi.fn(),
  select: vi.fn(),
  generateToken: vi.fn(),
}));

vi.mock("../src/models/user.model.js", () => ({
  default: { findOne },
}));

vi.mock("../src/shared/utils/token.js", () => ({
  generateToken,
}));

vi.mock("../src/shared/utils/email.util.js", () => ({
  sendResetPasswordEmail: vi.fn(),
  sendWelcomeEmail: vi.fn(),
}));

import { loginUserService } from "../src/modules/auth/auth.service.js";

describe("loginUserService", () => {
  beforeEach(() => {
    findOne.mockReset();
    select.mockReset();
    generateToken.mockReset();
    findOne.mockReturnValue({ select });
    generateToken.mockReturnValue("signed.jwt.token");
  });

  it("logs in a user whose course/subscription access has expired (course expiry != account expiry)", async () => {
    // loginUserService must never look at course/subscription entitlement —
    // only account state (isActive) and credentials. There is no course/
    // subscription lookup in this service at all, by design.
    const { hashPassword } = await import("../src/shared/utils/bcrypt.js");
    const hash = await hashPassword("CorrectHorse1!");
    select.mockResolvedValue({
      _id: "user1",
      email: "student@example.com",
      password: hash,
      role: "student",
      isActive: true,
    });

    const result = await loginUserService({
      email: "student@example.com",
      password: "CorrectHorse1!",
    });

    expect(result.token).toBe("signed.jwt.token");
    expect(result.user.isActive).toBe(true);
  });

  it("rejects with a clean 401 (not a 500 crash) for an OAuth/OTP user with no password set", async () => {
    // Regression for the bcrypt.compare(password, undefined) crash.
    select.mockResolvedValue({
      _id: "user2",
      email: "oauth@example.com",
      password: undefined,
      role: "student",
      isActive: true,
    });

    await expect(
      loginUserService({ email: "oauth@example.com", password: "whatever" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects disabled accounts before checking the password", async () => {
    select.mockResolvedValue({
      _id: "user3",
      email: "disabled@example.com",
      password: "somehash",
      role: "student",
      isActive: false,
    });

    await expect(
      loginUserService({ email: "disabled@example.com", password: "whatever" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects an unknown email with 401", async () => {
    select.mockResolvedValue(null);

    await expect(
      loginUserService({ email: "nobody@example.com", password: "whatever" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
