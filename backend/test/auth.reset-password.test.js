import { beforeEach, describe, expect, it, vi } from "vitest";

const { findOne, save, hashPassword, sendResetPasswordEmail } = vi.hoisted(() => ({
  findOne: vi.fn(),
  save: vi.fn(),
  hashPassword: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
}));

vi.mock("../src/models/user.model.js", () => ({
  default: { findOne },
}));

vi.mock("../src/shared/utils/bcrypt.js", () => ({
  hashPassword,
  comparePassword: vi.fn(),
}));

vi.mock("../src/shared/utils/email.util.js", () => ({
  sendResetPasswordEmail,
}));

import { resetPasswordService } from "../src/modules/auth/auth.service.js";

describe("resetPasswordService", () => {
  beforeEach(() => {
    findOne.mockReset();
    save.mockReset();
    hashPassword.mockReset();
    sendResetPasswordEmail.mockReset();
  });

  it("accepts a newPassword payload and resets the user password", async () => {
    const user = {
      password: "old-hash",
      passwordResetToken: "token-hash",
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      save,
    };

    findOne.mockResolvedValue(user);
    hashPassword.mockResolvedValue("hashed-new-password");
    save.mockResolvedValue(user);

    const result = await resetPasswordService({
      token: "a".repeat(64),
      newPassword: "NewPassword@123",
    });

    expect(result).toEqual({
      message: "Password has been reset successfully.",
    });
    expect(hashPassword).toHaveBeenCalledWith("NewPassword@123");
    expect(findOne).toHaveBeenCalledWith({
      passwordResetToken: expect.any(String),
      passwordResetExpires: { $gt: expect.any(Number) },
    });
    expect(user.password).toBe("hashed-new-password");
    expect(user.passwordResetToken).toBeNull();
    expect(user.passwordResetExpires).toBeNull();
    expect(user.passwordChangedAt).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalledTimes(1);
  });
});