import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findOne, create, countDocuments } = vi.hoisted(() => ({
  findOne: vi.fn(),
  create: vi.fn(),
  countDocuments: vi.fn(),
}));

vi.mock("../src/models/allIndiaTestSeries.model.js", () => ({
  default: { findOne },
}));

vi.mock("../src/models/test.model.js", () => ({
  default: { create, countDocuments },
}));

import { createAITSTest } from "../src/modules/aits/aits.service.js";

describe("AITS service", () => {
  beforeEach(() => {
    findOne.mockReset();
    create.mockReset();
    countDocuments.mockReset();
  });

  it("stores a test against the AITS without chapter references", async () => {
    const aitsId = new mongoose.Types.ObjectId().toString();
    const teacherId = new mongoose.Types.ObjectId().toString();

    findOne.mockReturnValue({
      lean: () => Promise.resolve({ _id: aitsId, teacherId }),
    });
    countDocuments.mockResolvedValue(0);
    create.mockResolvedValue({ _id: "test-1" });

    await createAITSTest(
      aitsId,
      {
        title: "AITS Round 1",
        description: "Mock test",
        duration: 120,
        passingMarks: 55,
        instructions: "Attempt all questions",
        attemptLimit: 2,
        isProctored: true,
        isPaid: true,
      },
      teacherId
    );

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0]).toMatchObject({
      title: "AITS Round 1",
      description: "Mock test",
      duration: 120,
      passingMarks: 55,
      instructions: "Attempt all questions",
      attemptLimit: 2,
      isProctored: true,
      isPaid: true,
      type: "aits",
      chapterId: null,
      subjectId: null,
      topicId: null,
      order: 0,
    });
    expect(create.mock.calls[0][0].aitsId.toString()).toBe(aitsId);
    expect(create.mock.calls[0][0].teacherId.toString()).toBe(teacherId);
  });
});