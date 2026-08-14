import { describe, expect, it } from "vitest";
import { comparePassword, hashPassword } from "../src/shared/utils/bcrypt.js";

describe("comparePassword", () => {
  it("returns false (not a crash) when the stored hash is undefined", async () => {
    // Regression: OAuth/OTP users have no `password` field. bcrypt.compare
    // throws on a null/undefined hash — that used to bubble up as an
    // unhandled 500 instead of a clean "invalid credentials" response.
    await expect(comparePassword("anything", undefined)).resolves.toBe(false);
  });

  it("returns false when the stored hash is null", async () => {
    await expect(comparePassword("anything", null)).resolves.toBe(false);
  });

  it("still validates a real hash correctly", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    await expect(comparePassword("Sup3rSecret!", hash)).resolves.toBe(true);
    await expect(comparePassword("wrong", hash)).resolves.toBe(false);
  });
});
