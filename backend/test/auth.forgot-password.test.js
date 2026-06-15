import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findOne, save, sendResetPasswordEmail } = vi.hoisted(() => ({
  findOne: vi.fn(),
  save: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
}));

vi.mock("../src/models/user.model.js", () => ({
  default: { findOne },
}));

vi.mock("../src/shared/utils/email.util.js", () => ({
  sendResetPasswordEmail,
}));

import { forgotPasswordService } from "../src/modules/auth/auth.service.js";

describe("forgotPasswordService", () => {
  beforeEach(() => {
    findOne.mockReset();
    save.mockReset();
    sendResetPasswordEmail.mockReset();
  });

  it("persists a reset token and sends the reset email", async () => {
    const email = "student@example.com";
    const name = "Student One";
    const userId = new mongoose.Types.ObjectId();

    const user = {
      _id: userId,
      email,
      name,
      save,
    };

    findOne.mockResolvedValue(user);
    save.mockResolvedValue(user);
    sendResetPasswordEmail.mockResolvedValue(undefined);

    const result = await forgotPasswordService({ email });

    expect(result).toEqual({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
    expect(sendResetPasswordEmail).toHaveBeenCalledTimes(1);
    expect(sendResetPasswordEmail.mock.calls[0][0]).toBe(email);
    expect(sendResetPasswordEmail.mock.calls[0][1]).toBe(name);
    expect(sendResetPasswordEmail.mock.calls[0][2]).toMatch(/^[a-f0-9]{64}$/);
    expect(user.passwordResetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(user.passwordResetExpires).toBeInstanceOf(Date);
    expect(user.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("fails and clears the reset token if email delivery fails", async () => {
    const email = "student@example.com";
    const name = "Student One";
    const userId = new mongoose.Types.ObjectId();

    const user = {
      _id: userId,
      email,
      name,
      save,
    };

    findOne.mockResolvedValue(user);
    save.mockResolvedValue(user);
    sendResetPasswordEmail.mockRejectedValue(new Error("mail failed"));

    await expect(forgotPasswordService({ email })).rejects.toThrow(
      "Failed to send password reset email: mail failed"
    );

    expect(user.passwordResetToken).toBeNull();
    expect(user.passwordResetExpires).toBeNull();
    expect(save).toHaveBeenCalledTimes(2);
  });
});