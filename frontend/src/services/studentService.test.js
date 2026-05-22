import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiGet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock("./api", () => ({
  default: {
    get: apiGet,
  },
}));

import { getAvailableTests } from "./studentService";

describe("studentService", () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  it("requests the student test hierarchy from the tests endpoint", async () => {
    apiGet.mockResolvedValue({ data: { success: true, categories: [] } });

    const result = await getAvailableTests();

    expect(apiGet).toHaveBeenCalledWith("/student/tests");
    expect(result).toEqual({ success: true, categories: [] });
  });
});