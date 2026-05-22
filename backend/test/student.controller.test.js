import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserSubscription, getAvailableTree, getFullHierarchyTree } = vi.hoisted(() => ({
  getUserSubscription: vi.fn(),
  getAvailableTree: vi.fn(),
  getFullHierarchyTree: vi.fn(),
}));

const { topicAccessFind } = vi.hoisted(() => ({
  topicAccessFind: vi.fn(),
}));

vi.mock("../src/modules/student/student.service.js", () => ({
  getUserSubscription,
}));

vi.mock("../src/modules/testSeries/testSeries.service.js", () => ({
  getStudentSeriesTree: getAvailableTree,
  getFullHierarchyTree,
}));

vi.mock("../src/models/topicAccess.model.js", () => ({
  default: { find: topicAccessFind },
}));

vi.mock("../src/infrastucture/queues/activity.queue.js", () => ({
  activityQueue: { add: vi.fn() },
}));

import { getAvailableTests } from "../src/modules/student/student.controller.js";

describe("Student tests controller", () => {
  beforeEach(() => {
    getUserSubscription.mockReset();
    getAvailableTree.mockReset();
    topicAccessFind.mockReset();
  });

  it("returns the category/exam/test-series hierarchy used by the sidebar", async () => {
    getUserSubscription.mockResolvedValue({ status: "ACTIVE", plan: "FREE" });
    getAvailableTree.mockResolvedValue([
      {
        _id: "topic-1",
        title: "Series Topic",
        isPaid: true,
      },
    ]);
    getFullHierarchyTree.mockResolvedValue([
      {
        _id: "cat-1",
        title: "Category 1",
        exams: [
          {
            _id: "exam-1",
            title: "Exam 1",
            testSeries: [
              {
                _id: "topic-1",
                title: "Series Topic",
                isPaid: true,
              },
            ],
          },
        ],
      },
    ]);
    topicAccessFind.mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve([]),
      }),
    });

    const req = { user: { _id: "66b2f3d2c0a1c3b4d5e6f780" } };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    getAvailableTests(req, res);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.topics[0]).toMatchObject({
      _id: "topic-1",
      title: "Series Topic",
      isUnlocked: false,
    });
    expect(payload.categories[0]).toMatchObject({
      _id: "cat-1",
      title: "Category 1",
    });
    expect(payload.categories[0].exams[0].testSeries[0]).toMatchObject({
      _id: "topic-1",
      title: "Series Topic",
      isUnlocked: false,
    });
  });
});