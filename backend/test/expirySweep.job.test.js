import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  courseFind,
  courseUpdateMany,
  topicFind,
  topicUpdateMany,
  subUpdateMany,
  sendAccessExpiredEmail,
} = vi.hoisted(() => ({
  courseFind: vi.fn(),
  courseUpdateMany: vi.fn(),
  topicFind: vi.fn(),
  topicUpdateMany: vi.fn(),
  subUpdateMany: vi.fn(),
  sendAccessExpiredEmail: vi.fn(),
}));

// Mimics the mongoose chain: find(...).populate().populate().select().lean()
const chainable = (result) => ({
  populate: () => chainable(result),
  select: () => chainable(result),
  lean: () => Promise.resolve(result),
});

vi.mock("../src/models/courseAccess.model.js", () => ({
  default: { find: courseFind, updateMany: courseUpdateMany },
}));

vi.mock("../src/models/topicAccess.model.js", () => ({
  default: { find: topicFind, updateMany: topicUpdateMany },
}));

vi.mock("../src/models/subscription.model.js", () => ({
  default: { updateMany: subUpdateMany },
}));

vi.mock("../src/infrastucture/logger/logger.js", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("../src/shared/utils/email.util.js", () => ({
  sendAccessExpiredEmail,
}));

import { runExpirySweep } from "../src/infrastucture/jobs/expirySweep.job.js";

describe("runExpirySweep", () => {
  beforeEach(() => {
    courseFind.mockReset().mockReturnValue(chainable([]));
    courseUpdateMany.mockReset().mockResolvedValue({ modifiedCount: 0 });
    topicFind.mockReset().mockReturnValue(chainable([]));
    topicUpdateMany.mockReset().mockResolvedValue({ modifiedCount: 0 });
    subUpdateMany.mockReset().mockResolvedValue({ modifiedCount: 0 });
    sendAccessExpiredEmail.mockReset().mockResolvedValue(undefined);
  });

  it("sends one expiry-notice email per newly-lapsed course access, then flips status", async () => {
    courseFind.mockReturnValue(
      chainable([
        {
          userId: { name: "Asha", email: "asha@example.com" },
          courseId: { title: "NEET Physics" },
        },
      ])
    );

    await runExpirySweep();

    expect(sendAccessExpiredEmail).toHaveBeenCalledWith(
      "asha@example.com",
      "Asha",
      "NEET Physics"
    );
    expect(courseUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ACTIVE" }),
      { $set: { status: "EXPIRED" } }
    );
  });

  it("skips sending mail for a row with no linked user, but still expires it", async () => {
    courseFind.mockReturnValue(
      chainable([{ userId: null, courseId: { title: "Orphan Course" } }])
    );

    await runExpirySweep();

    expect(sendAccessExpiredEmail).not.toHaveBeenCalled();
    expect(courseUpdateMany).toHaveBeenCalled();
  });

  it("is a no-op mail-wise when nothing is newly lapsed (idempotency lives in the ACTIVE-only query filter)", async () => {
    await runExpirySweep();

    expect(sendAccessExpiredEmail).not.toHaveBeenCalled();
    expect(courseUpdateMany).toHaveBeenCalled();
  });
});
