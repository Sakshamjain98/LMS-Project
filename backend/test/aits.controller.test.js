import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAITSTest } = vi.hoisted(() => ({
  createAITSTest: vi.fn(),
}));

vi.mock("../src/modules/aits/aits.service.js", () => ({
  createAITSTest,
}));

import { STATUS_CODES } from "../src/constants/statusCode.js";
import { createTest } from "../src/modules/aits/aits.controller.js";

describe("AITS controller", () => {
  beforeEach(() => {
    createAITSTest.mockReset();
  });

  it("creates an AITS test without requiring chapter hierarchy", async () => {
    createAITSTest.mockResolvedValue({ _id: "test-1", title: "AITS 1" });

    const req = {
      params: { aitsId: "66b2f3d2c0a1c3b4d5e6f789" },
      body: { title: "AITS 1", duration: 90 },
      user: { _id: "66b2f3d2c0a1c3b4d5e6f780" },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await createTest(req, res);

    expect(createAITSTest).toHaveBeenCalledWith(req.params.aitsId, req.body, req.user._id);
    expect(res.status).toHaveBeenCalledWith(STATUS_CODES.CREATED);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "AITS test created",
      test: { _id: "test-1", title: "AITS 1" },
    });
  });
});