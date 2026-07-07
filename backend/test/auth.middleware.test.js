import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findById } = vi.hoisted(() => ({ findById: vi.fn() }));

vi.mock("../src/models/user.model.js", () => ({
  default: { findById },
}));

vi.mock("../src/infrastucture/redis/activeUsers.redis.js", () => ({
  markUserActive: vi.fn().mockResolvedValue(undefined),
}));

import { authMiddleware } from "../src/middlewares/auth.middleware.js";

const JWT_SECRET = "test-secret-at-least-16-chars";
process.env.JWT_SECRET = JWT_SECRET;

const makeReqRes = (token) => ({
  req: { headers: { authorization: token ? `Bearer ${token}` : undefined } },
  res: {},
});

describe("authMiddleware", () => {
  beforeEach(() => {
    findById.mockReset();
  });

  it("cleanly 401s (doesn't crash) when the token's user has been deleted", async () => {
    const token = jwt.sign({ userId: "deleted-user-id" }, JWT_SECRET);
    findById.mockReturnValue({ select: () => Promise.resolve(null) });
    const { req, res } = makeReqRes(token);
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(401);
  });

  it("passes through a valid, existing, active user", async () => {
    const token = jwt.sign({ userId: "user-1" }, JWT_SECRET);
    findById.mockReturnValue({
      select: () => Promise.resolve({ _id: "user-1", isActive: true, passwordChangedAt: null }),
    });
    const { req, res } = makeReqRes(token);
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith(); // called with no error
    expect(req.user).toMatchObject({ _id: "user-1" });
  });
});
